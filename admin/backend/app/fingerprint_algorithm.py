"""随机数指纹算法模块，固化 HTML 原型的分布、统计和相似度计算口径。"""

from __future__ import annotations

import math
import re

BUCKET_COUNT = 355
MIN_VALID_SAMPLES = 10
JS_EPSILON = 1e-10


def extract_probe_number(text: str) -> int | None:
    """从模型响应中提取 1-355 的探针数字，失败时返回空值并交给采样流程计入失败。"""

    match = re.search(r"\d+", text or "")
    if not match:
        return None
    number = int(match.group(0))
    if 1 <= number <= BUCKET_COUNT:
        return number
    return None


def build_distribution(numbers: list[int], bucket_count: int = BUCKET_COUNT) -> list[float]:
    """按源码口径把有效采样转成固定维度概率分布，作为 AI 行为指纹。"""

    counts = [0] * bucket_count
    if not numbers:
        return [0.0] * bucket_count
    for number in numbers:
        if 1 <= number <= bucket_count:
            counts[number - 1] += 1
    total = float(len(numbers))
    return [count / total for count in counts]


def build_stats(numbers: list[int]) -> dict[str, float | int]:
    """按源码口径生成采样统计，帮助后台解释分布差异但不参与最终相似度排序。"""

    if not numbers:
        return {"mean": 0.0, "median": 0.0, "std_dev": 0.0, "min": 0, "max": 0, "unique": 0}
    sorted_numbers = sorted(numbers)
    mean = sum(numbers) / len(numbers)
    variance = sum((number - mean) ** 2 for number in numbers) / len(numbers)
    return {
        "mean": mean,
        "median": float(source_median(sorted_numbers)),
        "std_dev": math.sqrt(variance),
        "min": sorted_numbers[0],
        "max": sorted_numbers[-1],
        "unique": len(set(numbers)),
    }


def source_median(sorted_numbers: list[int]) -> int:
    """复刻 HTML 原型的中位数规则，偶数样本取排序后偏上的那个采样值。"""

    return sorted_numbers[len(sorted_numbers) // 2]


def cosine_similarity(left: list[float], right: list[float]) -> float:
    """计算两个指纹分布的余弦相似度，用于衡量模型随机数偏好方向是否接近。"""

    dot_product = 0.0
    left_norm = 0.0
    right_norm = 0.0
    for left_value, right_value in zip(left, right, strict=True):
        dot_product += left_value * right_value
        left_norm += left_value * left_value
        right_norm += right_value * right_value
    if left_norm == 0 or right_norm == 0:
        return 0.0
    return dot_product / (math.sqrt(left_norm) * math.sqrt(right_norm))


def js_divergence(left: list[float], right: list[float]) -> float:
    """计算源码同款 Jensen-Shannon 散度，用于惩罚局部概率质量差异。"""

    divergence = 0.0
    for left_value, right_value in zip(left, right, strict=True):
        p_value = left_value + JS_EPSILON
        q_value = right_value + JS_EPSILON
        middle = (p_value + q_value) / 2
        divergence += (
            p_value * math.log(p_value / middle) + q_value * math.log(q_value / middle)
        ) / 2
    return divergence


def overall_similarity(distribution: list[float], reference_distribution: list[float]) -> float:
    """输出源码综合匹配度，业务含义是待测模型与参照模型随机数指纹的接近程度。"""

    cosine_score = cosine_similarity(distribution, reference_distribution)
    divergence = js_divergence(distribution, reference_distribution)
    return cosine_score * math.exp(-divergence)
