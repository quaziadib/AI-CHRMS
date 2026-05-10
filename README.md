# AI-CHRMS

## Input from stakeholders

- Iqbal is a Principal Investigator. His requirement is to produce a dashboard for paitents based on the EHR of that paitents. So, that paitent can know about the current health status about him/her. Also, based on data of that paitent. ML/LLM model will predict his/her probability of having serious diseases. Like:
    - i) Risk Prediction Model: A visual representation of the user's risk level (low, moderate, high).
    - ii) AI Recommendations: After generating a risk score, offer personalized lifestyle, diet, or exercise recommendations.
    - iii) Predict the future progression of blood sugar levels, insulin resistance, etc., based on current data.
    - iv) A time-series model to predict how the patient’s health might evolve (using LSTM or ARIMA models).
    - v) Use LLMs for analyzing text input from users about their symptoms or health concerns.

       
- Fahim in Conversional AI Product lead. His concerns are mostly evolve around communcation with the paitents using chatbot systems.
    - i) AI-powered Content Generation: Use the LLM to generate personalized content, such as articles, FAQs, or tips based on the user’s condition.
    - ii) Chatbot Assistance: An AI-powered chatbot to answer common health-related questions, provide advice, and recommend resources.
    - iii) Integrate NLP to generate real-time responses based on health data input by the user (e.g., asking "What should I do if my sugar level is high?"
    - iv) Use AI to provide personalized meal plans, exercise routines, and lifestyle changes based on the user’s unique profile.
 

- Sabbir's interst is in national health from nation grade policy level. He is more focused on 
    - i) Public Health Monitoring and Insights
    - ii) AI models can analyze large-scale population health data to predict diabetes prevalence trends - present in the Bangladesh map
    - iii) Forecast healthcare needs (e.g., number of diabetes cases) to aid in resource allocation and policy-making.
    - iv) AI models can predict areas with high diabetes incidence, allowing for targeted distribution of medical resources (e.g., clinics, medicines, testing kits).
    - iv) AI can analyze anonymized clinical data to identify new patterns or trends in diabetes development (e.g., genetic factors, lifestyle correlations


- Adib is the techincal backbone of this project. His interests are:
    - i) Developing the model with current widely use industry grade tools like langchain, langraph, vllm.
    - ii) for MVP he wants to use GPT, GEMINI, Claude type solutions. Later He has plan to SFT a small LLM (i.e., gemma-4-e4b-it)
    - iii) Create models to assess diabetes risk by region, age group, socioeconomic status, etc.
    - iv) Want to take health information from paitents and also for create dashboard for doctor, national policy administrators, paitents, project maintainer. 
    - v) Backend stack should be FastAPI (python). Frontend should be Next.js
    - vi) scalability is a core issue. 
    - vii)Use AI to flag any abnormalities in lab results (e.g., blood sugar levels, HbA1c values) that might indicate an increased risk of diabetes or complications
    - viii)AI can help doctors quickly analyze and extract relevant information from electronic health records (EHR), making it easier to track a patient’s history and recommend the best course of action.
    - ix) Train an AI assistant that helps patients manage their diabetes day-to-day, answering questions, reminding them of medication, and suggesting lifestyle changes

- Steve in marketing wants an attractive site that works well with a modern browser.