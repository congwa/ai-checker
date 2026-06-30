"""评分算法测试，验证真实相似度和低分平滑满足业务展示规则。"""

import pytest

from app.scoring import (
    calculate_distribution,
    calculate_stats,
    display_score,
    is_score_in_public_range,
    js_divergence,
    ranged_public_score,
    raw_similarity,
    smooth_score,
    validate_public_score_range,
)


def test_raw_similarity_same_distribution_returns_one() -> None:
    """同一分布应被识别为完全相似，确保首次基准评分稳定为满分。"""

    distribution = calculate_distribution([1, 2, 3, 3])
    assert raw_similarity(distribution, distribution) == 1.0
    assert js_divergence(distribution, distribution) == 0.0


def test_calculate_stats_keeps_source_median_rule() -> None:
    """产品评分门面必须沿用源码统计口径，只把展示分和平滑作为额外业务规则。"""

    stats = calculate_stats([1, 2, 100, 355])

    assert stats["median"] == 100.0


def test_display_score_uses_real_percentage() -> None:
    """后台真实结果直接使用原始相似度百分制，避免 90 分保底造成虚高。"""

    assert display_score(0.0) == 0.0
    assert display_score(-2.0) == 0.0
    assert display_score(0.9639191241994514) == pytest.approx(96.39191241994514)
    assert display_score(1.0) == 100.0


def test_smooth_score_shows_real_score_when_at_least_ninety() -> None:
    """90 分以上直接展示真实评分，不再额外平滑。"""

    assert smooth_score(96.39191241994514, None, 65) == pytest.approx(96.39191241994514)
    assert smooth_score(91.0, 85.0, 65) == 91.0


def test_smooth_score_keeps_low_scores_between_eighty_five_and_ninety() -> None:
    """90 分以下才平滑，且公开分不能低于 85，也不能达到 90。"""

    assert smooth_score(70.0, None, 65) == 85.0
    assert smooth_score(88.0, 86.0, 65) == pytest.approx(86.7)

    carried_from_old_high_score = smooth_score(70.0, 99.64, 65)
    assert 85.0 <= carried_from_old_high_score < 90.0
    assert carried_from_old_high_score == pytest.approx(88.2435)

    max_smoothing = smooth_score(70.0, 100.0, 100)
    assert 85.0 <= max_smoothing < 90.0
    assert max_smoothing == pytest.approx(89.7405)


def test_ranged_public_score_stays_inside_configured_bounds_without_edge_sticking() -> None:
    """启用渠道区间后，前台最终分应在区间内自然波动，不直接贴最低最高边。"""

    low = ranged_public_score(85.0, None, 65, "run-low", 90.0, 95.0)
    middle = ranged_public_score(90.0, low, 65, "run-middle", 90.0, 95.0)
    high = ranged_public_score(100.0, middle, 65, "run-high", 90.0, 95.0)

    assert 90.0 <= low <= 95.0
    assert 90.0 <= middle <= 95.0
    assert 90.0 <= high <= 95.0
    assert low != 90.0
    assert high != 95.0
    assert low < high
    assert ranged_public_score(90.0, low, 65, "run-middle", 90.0, 95.0) == middle


def test_public_score_range_validation_requires_meaningful_width() -> None:
    """渠道显示分区间必须是百分制内至少 5 分宽的有效区间。"""

    assert validate_public_score_range(85, 100) == (85.0, 100.0)
    assert is_score_in_public_range(92.5, 90.0, 95.0) is True
    assert is_score_in_public_range(97.0, 90.0, 95.0) is False
    with pytest.raises(ValueError, match="至少需要相差 5 分"):
        validate_public_score_range(90, 94)
