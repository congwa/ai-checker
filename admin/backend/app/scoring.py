"""产品评分门面，隔离源码指纹算法与 90 分下限、平滑曲线等展示规则。"""

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

MIN_PUBLIC_SCORE = 90.0
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
    """把原始相似度映射为公开展示分，满足业务要求的最低 90 分保护。"""

    return clamp(
        MIN_PUBLIC_SCORE + clamp(raw_score, 0.0, 1.0) * 10,
        MIN_PUBLIC_SCORE,
        MAX_PUBLIC_SCORE,
    )


def smooth_score(
    current_display_score: float,
    previous_smooth_score: float | None,
    smoothing_level: int,
) -> float:
    """按后台配置的平滑度计算 EMA 分数，让前台曲线稳定但仍能反映趋势变化。"""

    if previous_smooth_score is None:
        return current_display_score
    normalized = clamp(float(smoothing_level), 0.0, 100.0)
    alpha = max(0.05, 1 - normalized / 100)
    smoothed = alpha * current_display_score + (1 - alpha) * previous_smooth_score
    return clamp(smoothed, MIN_PUBLIC_SCORE, MAX_PUBLIC_SCORE)
