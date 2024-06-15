# RESTful API Documentation

## Introduction

Welcome to the GraphScope Interactive RESTful API documentation. This guide is
tailored for developers and administrators seeking to manage the Interactive
service more efficiently. Here, we delve into the intricate workings of the
RESTful HTTP interfaces provided by the Interactive Admin service, offering a
comprehensive toolkit for real-time service management. This document is crucial
for those looking to customize or enhance their GraphScope Interactive
experience.

## API Overview

The table below provides an overview of the available APIs:

| API name    | Method and URL           | Explanation                                                                           |
| ----------- | ------------------------ | ------------------------------------------------------------------------------------- |
| ListGraphs  | GET /v1/graph            | Get all graphs in current interactive service, the schema for each graph is returned. |
| DeleteGraph | DELETE /v1/graph/{graph} | Delete the specified graph.                                                           |

## Detailed API Documentation

For each API, the documentation will include a detailed description, request
format, example curl command, expected response format and body, and status
codes. Here's an example for one of the APIs:

### ListGraphs API (GraphManagement Category)

#### Description

This API lists all graphs currently managed by the Interactive service,
providing detailed schema information for each.

#### HTTP Request

- **Method**: DELETE
- **Endpoint**: `/v1/graph/{graph_id}`
- **Content-type**: `application/json`

#### Curl Command Example

```bash
curl -X DELETE  -H "Content-Type: application/json" "http://{INTERACTIVE_ENDPOINT}/v1/graph/{graph_id}"
```

#### Expected Response

- **Format**: application/json
- **Body**:

```json
{
  "message": "message"
}
```

#### Status Codes

- `200 OK`: Request successful.
- `500 Internal Error`: Server internal Error.

### GetGraphSchema (GraphManagement Category)

#### Description

Get the schema for the specified graph.
