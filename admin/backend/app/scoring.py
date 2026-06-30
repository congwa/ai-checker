"""产品评分门面，隔离源码指纹算法与公开展示的分数平滑规则。"""

from __future__ import annotations

import hashlib

from app.fingerprint_algorithm import (
    BUCKET_COUNT,
    build_distribution,
    build_stats,
    extract_probe_number,
    overall_similarity,
)
from app.fingerprint_algorithm import (
    cosine_similarity as source_cosine_similarity,
)
from app.fingerprint_algorithm import (
    js_divergence as source_js_divergence,
)

MIN_PUBLIC_SCORE = 85.0
LOW_SCORE_CEILING = 89.99
REAL_SCORE_THRESHOLD = 90.0
MAX_PUBLIC_SCORE = 100.0
MIN_SCORE_RANGE_WIDTH = 5.0


def clamp(value: float, lower: float, upper: float) -> float:
    """将业务评分限制在可展示区间内，避免异常输入破坏前台曲线尺度。"""

    return max(lower, min(upper, value))


def extract_number(text: str) -> int | None:
    """从模型响应中提取 1-355 的业务采样值，无法解析时返回空值供 Runner 计入失败。"""

    return extract_probe_number(text)


def calculate_distribution(numbers: list[int], bucket_count: int = BUCKET_COUNT) -> list[float]:
    """把模型输出数字转换为固定维度概率分布，作为后续相似度比较的统一业务指纹。"""

    return build_distribution(numbers, bucket_count)


def calculate_stats(numbers: list[int]) -> dict[str, float | int]:
    """生成后台和前台展示所需的采样统计，帮助用户理解分布差异来自哪里。"""

    return build_stats(numbers)


def cosine_similarity(left: list[float], right: list[float]) -> float:
    """计算两个分布的方向相似度，用于衡量模型输出模式是否接近基准。"""

    return clamp(source_cosine_similarity(left, right), 0.0, 1.0)


def js_divergence(left: list[float], right: list[float]) -> float:
    """计算 Jensen-Shannon 散度，用于惩罚分布形状相近但局部差异明显的情况。"""

    return max(0.0, source_js_divergence(left, right))


def raw_similarity(distribution: list[float], baseline_distribution: list[float]) -> float:
    """输出 0-1 原始相似度，保留给后台诊断和未来 ZeroPrint 插件共同使用。"""

    return clamp(overall_similarity(distribution, baseline_distribution), 0.0, 1.0)


def display_score(raw_score: float) -> float:
    """把 0-1 原始相似度转换成真实百分制评分，保留后台诊断可信度。"""

    return clamp(raw_score, 0.0, 1.0) * MAX_PUBLIC_SCORE


def smooth_score(
    current_display_score: float,
    previous_smooth_score: float | None,
    smoothing_level: int,
) -> float:
    """90 分以上展示真实分；低于 90 分时平滑到 85-90 的公开低分区间。"""

    current_score = clamp(current_display_score, 0.0, MAX_PUBLIC_SCORE)
    if current_score >= REAL_SCORE_THRESHOLD:
        return current_score

    low_current_score = clamp(current_score, MIN_PUBLIC_SCORE, LOW_SCORE_CEILING)
    if previous_smooth_score is None:
        return low_current_score

    previous_low_score = clamp(previous_smooth_score, MIN_PUBLIC_SCORE, LOW_SCORE_CEILING)
    normalized = clamp(float(smoothing_level), 0.0, 100.0)
    alpha = max(0.05, 1 - normalized / 100)
    smoothed = alpha * low_current_score + (1 - alpha) * previous_low_score
    return clamp(smoothed, MIN_PUBLIC_SCORE, LOW_SCORE_CEILING)


def validate_public_score_range(
    min_score: float,
    max_score: float,
) -> tuple[float, float]:
    """校验并标准化渠道前台显示分区间，保证区间足够宽且在百分制内。"""

    normalized_min = float(min_score)
    normalized_max = float(max_score)
    if not 0.0 <= normalized_min < normalized_max <= MAX_PUBLIC_SCORE:
        raise ValueError("前台显示分区间必须在 0-100 之间，且最低分小于最高分")
    if normalized_max - normalized_min < MIN_SCORE_RANGE_WIDTH:
        raise ValueError("前台显示分区间至少需要相差 5 分")
    return normalized_min, normalized_max


def is_score_in_public_range(score: float, min_score: float, max_score: float) -> bool:
    """判断手动覆盖分是否落在当前渠道允许的前台显示区间内。"""

    normalized_min, normalized_max = validate_public_score_range(min_score, max_score)
    return normalized_min <= float(score) <= normalized_max


def ranged_public_score(
    base_public_score: float,
    previous_public_score: float | None,
    smoothing_level: int,
    run_id: str,
    min_score: float,
    max_score: float,
) -> float:
    """把系统前台分软压缩到渠道显示区间内，同时保留趋势和轻微差异。"""

    normalized_min, normalized_max = validate_public_score_range(min_score, max_score)
    width = normalized_max - normalized_min
    edge_padding = min(1.2, width * 0.08)
    inner_min = normalized_min + edge_padding
    inner_max = normalized_max - edge_padding
    if inner_min >= inner_max:
        inner_min = normalized_min
        inner_max = normalized_max

    normalized_score = clamp(
        (clamp(base_public_score, MIN_PUBLIC_SCORE, MAX_PUBLIC_SCORE) - MIN_PUBLIC_SCORE)
        / (MAX_PUBLIC_SCORE - MIN_PUBLIC_SCORE),
        0.0,
        1.0,
    )
    softened_ratio = normalized_score * normalized_score * (3 - 2 * normalized_score)
    compressed = inner_min + softened_ratio * (inner_max - inner_min)

    if previous_public_score is not None:
        normalized_smoothing = clamp(float(smoothing_level), 0.0, 100.0)
        alpha = max(0.12, 1 - normalized_smoothing / 100)
        previous = clamp(previous_public_score, normalized_min, normalized_max)
        compressed = alpha * compressed + (1 - alpha) * previous

    compressed += _stable_score_jitter(run_id, width)
    return round(clamp(compressed, normalized_min, normalized_max), 2)


def _stable_score_jitter(run_id: str, width: float) -> float:
    """用运行 ID 生成稳定微扰，避免连续点完全重叠但不引入随机性。"""

    digest = hashlib.sha256(run_id.encode("utf-8")).hexdigest()
    unit = int(digest[:8], 16) / 0xFFFFFFFF
    amplitude = min(0.18, width * 0.02)
    return (unit - 0.5) * 2 * amplitude
