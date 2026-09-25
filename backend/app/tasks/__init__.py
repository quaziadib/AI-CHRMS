# Task modules are imported by the Celery worker explicitly.
# Keep this package empty so the web API does not pull in forecast/AI
# stacks (and a Redis broker) during uvicorn startup on free hosts.
