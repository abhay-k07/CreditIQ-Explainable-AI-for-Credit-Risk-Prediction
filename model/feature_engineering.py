import numpy as np

def create_features(X):
    X = X.copy()

    # Log transform
    X['log_income'] = np.log1p(X['monthly_inc'])

    # Ratios
    X['income_to_debt'] = X['monthly_inc'] / (X['debt_ratio'] + 1)
    X['credit_per_age'] = X['open_credit'] / (X['age'] + 1)

    # Delinquency score
    X['delinq_score'] = (
        X['late_30_59']*1 +
        X['late_60_89']*2 +
        X['late_90']*3
    )

    # Utilization flag
    X['high_util'] = (X['rev_util'] > 0.8).astype(int)

    return X