"""产品评分门面，隔离源码指纹算法与公开展示的分数平滑规则。"""

from __future__ import annotations

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
