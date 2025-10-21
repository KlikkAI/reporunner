{{/*
Expand the name of the chart.
*/}}
{{- define "klikkflow.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "klikkflow.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "klikkflow.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "klikkflow.labels" -}}
helm.sh/chart: {{ include "klikkflow.chart" . }}
{{ include "klikkflow.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "klikkflow.selectorLabels" -}}
app.kubernetes.io/name: {{ include "klikkflow.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Component labels
*/}}
{{- define "klikkflow.componentLabels" -}}
{{ include "klikkflow.labels" . }}
app.kubernetes.io/component: {{ .component }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "klikkflow.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "klikkflow.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Database connection string for PostgreSQL
*/}}
{{- define "klikkflow.postgresql.connectionString" -}}
{{- if .Values.externalServices.externalPostgreSQL.enabled }}
postgresql://{{ .Values.externalServices.externalPostgreSQL.username }}:{{ .Values.externalServices.externalPostgreSQL.password }}@{{ .Values.externalServices.externalPostgreSQL.host }}:{{ .Values.externalServices.externalPostgreSQL.port }}/{{ .Values.externalServices.externalPostgreSQL.database }}
{{- else }}
postgresql://{{ .Values.postgresql.auth.username }}:{{ .Values.postgresql.auth.password }}@{{ include "klikkflow.fullname" . }}-postgresql:5432/{{ .Values.postgresql.auth.database }}
{{- end }}
{{- end }}

{{/*
MongoDB connection string
*/}}
{{- define "klikkflow.mongodb.connectionString" -}}
{{- if .Values.externalServices.externalMongoDB.enabled }}
{{ .Values.externalServices.externalMongoDB.uri }}
{{- else }}
mongodb://{{ .Values.mongodb.auth.username }}:{{ .Values.mongodb.auth.password }}@{{ include "klikkflow.fullname" . }}-mongodb:27017/{{ .Values.mongodb.auth.database }}
{{- end }}
{{- end }}

{{/*
Redis connection string
*/}}
{{- define "klikkflow.redis.connectionString" -}}
{{- if .Values.externalServices.externalRedis.enabled }}
redis://:{{ .Values.externalServices.externalRedis.password }}@{{ .Values.externalServices.externalRedis.host }}:{{ .Values.externalServices.externalRedis.port }}
{{- else }}
redis://:{{ .Values.redis.auth.password }}@{{ include "klikkflow.fullname" . }}-redis-master:6379
{{- end }}
{{- end }}

{{/*
Image name helper
*/}}
{{- define "klikkflow.image" -}}
{{- $registryName := .Values.global.imageRegistry | default .Values.klikkflow.image.registry -}}
{{- $repositoryName := .repository -}}
{{- $tag := .tag | default .Chart.AppVersion | toString -}}
{{- if $registryName }}
{{- printf "%s/%s:%s" $registryName $repositoryName $tag -}}
{{- else }}
{{- printf "%s:%s" $repositoryName $tag -}}
{{- end }}
{{- end }}

{{/*
Security context for pods
*/}}
{{- define "klikkflow.podSecurityContext" -}}
{{- if .Values.security.podSecurityContext }}
{{- toYaml .Values.security.podSecurityContext }}
{{- end }}
{{- end }}

{{/*
Security context for containers
*/}}
{{- define "klikkflow.containerSecurityContext" -}}
{{- if .Values.security.containerSecurityContext }}
{{- toYaml .Values.security.containerSecurityContext }}
{{- end }}
{{- end }}

{{/*
Node selector
*/}}
{{- define "klikkflow.nodeSelector" -}}
{{- if .nodeSelector }}
{{- toYaml .nodeSelector }}
{{- end }}
{{- end }}

{{/*
Tolerations
*/}}
{{- define "klikkflow.tolerations" -}}
{{- if .tolerations }}
{{- toYaml .tolerations }}
{{- end }}
{{- end }}

{{/*
Affinity
*/}}
{{- define "klikkflow.affinity" -}}
{{- if .affinity }}
{{- toYaml .affinity }}
{{- end }}
{{- end }}