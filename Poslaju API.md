# Poslaju API Integration Documentation

## 📋 Project Overview
Integration project with POS Malaysia (Poslaju) for parcel tracking functionality for **Rasumi** company.

## 🔐 Authentication Credentials (Staging)
- **Client ID**: `605840cf-ecd7-4803-b2cc-875469b7d548`
- **Client Secret**: `d41dd72c-d339-4060-8982-05065189269c`
- **Environment**: Development/Staging

## 🌐 API Endpoint Details
- **Base URL**: `https://api-dev.pos.com.my`
- **Tracking Endpoint**: `/as2corporate/tracking-event-list/v1/api/TrackingEventList`
- **HTTP Method**: `GET`
- **Server**: APIGW (API Gateway)
- **Content-Type**: `application/json`

## 📈 Integration Process (5-Step Flow)

### Step 1: ✅ **Subscription & Webhook Setup**
- **Required from Rasumi**: 
  - Subscription code
  - Webhook endpoint URL (optional for real-time updates)
- **Status**: Pending company decision on webhook implementation

### Step 2: ✅ **Staging Credentials Received**
- **Provided by POS Malaysia**: Client ID & Client Secret
- **Status**: **COMPLETED** - Credentials received

### Step 3: 🔄 **Development & Testing Phase** (Current Stage)
- Build tracking system
- Generate sample shipping labels  
- Submit test labels to POS Malaysia
- Wait for validation results

### Step 4: ⏳ **Production Credentials**
- Receive production environment credentials
- Update endpoints (remove `-dev` from URLs)

### Step 5: ⏳ **Go Live**
- Deploy to production environment

## 🧪 Authentication Testing Results

### Attempts Made:
| Method | Endpoint/Header | Result | Status Code |
|--------|----------------|---------|-------------|
| OAuth Token | `/oauth/token` | 404 Not Found | 404 |
| Bearer Token | `Authorization: Bearer {client_id}` | Unauthorized | 401 |
| API Key | `X-API-Key: {client_id}` | Unauthorized | 401 |
| HTTP Basic Auth | `Authorization: Basic {encoded}` | Unauthorized | 401 |
| Query Parameters | `?client_id=...&client_secret=...` | Unauthorized | 401 |

### 🔍 Key Findings:
- **Authentication Type**: Supports both `APIKey` and `Bearer` (per WWW-Authenticate header)
- **Current Status**: All authentication methods return 401 - credentials may need activation
- **Error Message**: "The provided token is invalid or expired"

## ⚠️ Current Blockers
1. **Authentication Method**: Need proper documentation from POS Malaysia
2. **Token Generation**: OAuth endpoint not found at standard locations  
3. **API Documentation**: Missing request/response format details
4. **Sample Data**: No test tracking numbers provided

## 📞 Next Actions Required

### Immediate (Contact POS Malaysia):
1. **Authentication Flow**: Request proper authentication documentation
2. **API Documentation**: Get complete API reference with:
   - Request headers format
   - Required parameters  
   - Response structure
   - Sample tracking numbers
3. **Credentials Activation**: Confirm if staging credentials are active

### Development Preparation:
1. **Technology Stack Decision**:
   - Frontend: React/Vue/Vanilla JS
   - Backend: Node.js/Python/PHP (for webhook handling)
2. **Webhook Implementation**: Decide if real-time tracking updates needed
3. **Project Structure**: Set up development environment

## 🛠️ Proposed Technical Architecture

### Option 1: Frontend-Only (if CORS allowed)
```javascript
// Direct API calls from browser
const trackParcel = async (trackingNumber) => {
  const response = await fetch(apiUrl, {
    headers: {
      'Authorization': 'Bearer {token}',
      'Content-Type': 'application/json'
    }
  });
};
```

### Option 2: Backend Proxy (Recommended)
```
Browser → Your Backend → POS Malaysia API
```
- Secure credential storage
- CORS handling
- Rate limiting
- Webhook processing

## 📊 Expected API Response Structure (To Be Confirmed)
```json
{
  "trackingNumber": "string",
  "status": "string", 
  "events": [
    {
      "timestamp": "datetime",
      "location": "string",
      "description": "string",
      "status": "string"
    }
  ]
}
```

## 🔗 Integration Checklist
- [ ] Get proper authentication documentation
- [ ] Receive active API credentials  
- [ ] Obtain sample tracking numbers
- [ ] Build tracking form UI
- [ ] Implement API integration
- [ ] Setup webhook endpoint (optional)
- [ ] Generate test shipping labels
- [ ] Submit for POS Malaysia validation
- [ ] Receive production credentials
- [ ] Deploy to production

## 📝 Contact Information
- **Company**: Rasumi
- **API Provider**: POS Malaysia
- **Integration Type**: Corporate AS2 Tracking API
- **Project**: Parcel Tracking System

---
*Document updated: October 14, 2025*  
*Next update: After POS Malaysia authentication clarification*