import pandas as pd

def load_data(path):
    return pd.read_csv(path)

def clean_data(df):
    df = df.copy()

    # Remove invalid utilization
    df = df[df['rev_util'] < 5]

    # Cap outliers
    df.loc[:, 'monthly_inc'] = df['monthly_inc'].clip(
        upper=df['monthly_inc'].quantile(0.99)
    )
    df.loc[:, 'debt_ratio'] = df['debt_ratio'].clip(
        upper=df['debt_ratio'].quantile(0.99)
    )

    # Remove invalid income
    df = df[df['monthly_inc'] > 0]

    return df

def split_data(df):
    X = df.drop('dlq_2yrs', axis=1)
    y = df['dlq_2yrs']
    return X, y