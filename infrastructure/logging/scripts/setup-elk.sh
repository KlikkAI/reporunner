#!/bin/bash

# ELK Stack Setup Script for Reporunner
# This script initializes the ELK stack with proper configurations

set -e

echo "🔧 Setting up ELK Stack for Reporunner..."

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p elasticsearch/data
mkdir -p logstash/pipeline
mkdir -p kibana/config
mkdir -p filebeat/config
mkdir -p elastalert/rules

# Set proper permissions
echo "🔐 Setting permissions..."
chmod 777 elasticsearch/data
chmod 644 logstash/pipeline/*.conf
chmod 644 kibana/config/kibana.yml
chmod 644 filebeat/config/filebeat.yml

# Start the ELK stack
echo "🚀 Starting ELK stack..."
docker-compose up -d elasticsearch

# Wait for Elasticsearch to be ready
echo "⏳ Waiting for Elasticsearch to be ready..."
until curl -s http://localhost:9200/_cat/health | grep -q green; do
  echo "Waiting for Elasticsearch..."
  sleep 10
done

echo "✅ Elasticsearch is ready!"

# Create index templates
echo "📋 Creating index templates..."
curl -X PUT "localhost:9200/_template/reporunner-logs" -H 'Content-Type: application/json' -d'
{
  "index_patterns": ["reporunner-*"],
  "settings": {
    "number_of_shards": 2,
    "number_of_replicas": 1,
    "refresh_interval": "5s"
  },
  "mappings": {
    "properties": {
      "@timestamp": { "type": "date" },
      "level": { "type": "keyword" },
      "message": { "type": "text" },
      "service_name": { "type": "keyword" },
      "trace_id": { "type": "keyword" },
      "span_id": { "type": "keyword" },
      "user_id": { "type": "keyword" },
      "workflow_id": { "type": "keyword" },
      "execution_id": { "type": "keyword" },
      "response_time": { "type": "long" },
      "status_code": { "type": "integer" }
    }
  }
}'

# Start remaining services
echo "🚀 Starting Logstash, Kibana, and other services..."
docker-compose up -d

# Wait for Kibana to be ready
echo "⏳ Waiting for Kibana to be ready..."
until curl -s http://localhost:5601/api/status | grep -q '"level":"available"'; do
  echo "Waiting for Kibana..."
  sleep 10
done

echo "✅ Kibana is ready!"

# Import Kibana dashboards and visualizations
echo "📊 Setting up Kibana dashboards..."
curl -X POST "localhost:5601/api/saved_objects/_import" \
  -H "Content-Type: application/json" \
  -H "kbn-xsrf: true" \
  -d '{
    "objects": [
      {
        "type": "index-pattern",
        "id": "reporunner-*",
        "attributes": {
          "title": "reporunner-*",
          "timeFieldName": "@timestamp"
        }
      }
    ]
  }'

echo "🎉 ELK Stack setup completed successfully!"
echo ""
echo "🔗 Access URLs:"
echo "   Elasticsearch: http://localhost:9200"
echo "   Kibana: http://localhost:5601"
echo "   Logstash: http://localhost:9600"
echo ""
echo "📚 Next steps:"
echo "   1. Configure your applications to send logs to Logstash (port 5044)"
echo "   2. Set up ElastAlert SMTP configuration in elastalert/smtp_auth.yaml"
echo "   3. Access Kibana to create custom dashboards"
echo "   4. Monitor logs and set up additional alerting rules as needed"