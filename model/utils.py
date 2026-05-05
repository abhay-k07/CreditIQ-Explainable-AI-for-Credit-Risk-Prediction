import pickle
import shap

def create_explainer():
    xgb = pickle.load(open("../artifacts/xgb_model.pkl", "rb"))
    explainer = shap.TreeExplainer(xgb)
    pickle.dump(explainer, open("../artifacts/explainer.pkl", "wb"))
    print("✅ SHAP explainer saved!")