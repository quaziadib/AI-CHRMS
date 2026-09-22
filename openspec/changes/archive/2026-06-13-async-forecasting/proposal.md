# Proposal: Async Health Forecasting

Patients needed forward-looking glucose trajectories beyond historical charts. We added Celery/Redis forecast jobs (ARIMA with trend/synthetic fallbacks), snapshot capture, enqueue/poll/latest APIs with sync fallback, and a ProgressionChart that polls until results appear.
