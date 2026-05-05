import pickle
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
from scipy.stats import ks_2samp
from sklearn.model_selection import train_test_split

from preprocess import load_data, clean_data, split_data
from feature_engineering import create_features

# Load data
df = load_data("../data/Credit Risk Benchmark Dataset.csv")
df = clean_data(df)

X, y = split_data(df)
X = create_features(X)

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Load model
model = pickle.load(open("../artifacts/model.pkl", "rb"))

# Predict
y_pred = model.predict(X_test)
y_prob = model.predict_proba(X_test)[:, 1]

# Metrics
print("Accuracy:", accuracy_score(y_test, y_pred))
print("Precision:", precision_score(y_test, y_pred))
print("Recall:", recall_score(y_test, y_pred))
print("F1 Score:", f1_score(y_test, y_pred))
print("ROC-AUC:", roc_auc_score(y_test, y_prob))

# KS
ks = ks_2samp(y_prob[y_test==1], y_prob[y_test==0])
print("KS Statistic:", ks.statistic)

# Gini
gini = 2 * roc_auc_score(y_test, y_prob) - 1
print("Gini:", gini)