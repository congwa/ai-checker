"""源码指纹算法测试，锁定 HTML 原型的随机数分布、统计和相似度口径。"""

import pytest

from app.fingerprint_algorithm import (
    build_distribution,
    build_stats,
    cosine_similarity,
    js_divergence,
    overall_similarity,
)


def test_build_distribution_matches_html_probability_buckets() -> None:
    """分布桶必须保持 355 维源码口径，确保参照和任务指纹可以长期比较。"""

    distribution = build_distribution([1, 2, 2, 355])

    assert len(distribution) == 355
    assert distribution[0] == pytest.approx(0.25)
    assert distribution[1] == pytest.approx(0.5)
    assert distribution[354] == pytest.approx(0.25)
    assert sum(distribution) == pytest.approx(1.0)


def test_build_stats_uses_html_upper_median_for_even_samples() -> None:
    """偶数样本中位数要复刻源码偏上取值，避免后台统计口径悄悄漂移。"""

    stats = build_stats([1, 2, 100, 355])

    assert stats["median"] == 100.0
    assert stats["unique"] == 4


def test_overall_similarity_matches_html_formula_golden_value() -> None:
    """综合匹配度必须等于源码的 cosine * exp(-JS)，用于防止未来误改核心公式。"""

    left = build_distribution([1, 2, 2, 355])
    right = build_distribution([2, 2, 3, 355])

    assert cosine_similarity(left, right) == pytest.approx(0.8333333333333335)
    assert js_divergence(left, right) == pytest.approx(0.1732867930146601)
    assert overall_similarity(left, right) == pytest.approx(0.7007470142007449)
