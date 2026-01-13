# Store Dashboard

The Store Dashboard is the main interface for users to interact with their assigned stores. Each store has its own dedicated dashboard accessible through the sidebar navigation.

## Overview

Every store dashboard provides access to multiple functional areas:

1. **Main Dashboard** - Overview and summary of store activity
2. **1K Usage** - Track and manage usage metrics
3. **P&L (Profit & Loss)** - Financial reporting and analysis
4. **Associates** - Manage store associates/users

## Access Control

- Users can only access stores they are assigned to
- Admins can access all stores
- Store dashboards are accessible via the sidebar navigation, showing only stores assigned to the current user

## Current Implementation

Currently, only the **Main Dashboard** is implemented, displaying the store number and a welcome message.

## Planned Features

### 1. Main Dashboard
- **Status**: ✅ Implemented (basic version)
- **Location**: `/stores/:id`
- **Purpose**: Central hub showing store overview and key metrics
- **Future Enhancements**:
  - Key performance indicators (KPIs)
  - Recent activity summary
  - Quick access to other sections
  - Visual charts and graphs

### 2. 1K Usage
- **Status**: 📋 Planned
- **Location**: `/stores/:id/usage` (to be implemented)
- **Purpose**: Track and manage usage metrics
- **Planned Features**:
  - Usage tracking and reporting
  - Usage analytics and trends
  - Usage quotas and limits
  - Historical usage data

### 3. P&L (Profit & Loss)
- **Status**: 📋 Planned
- **Location**: `/stores/:id/pl` or `/stores/:id/profit-loss` (to be implemented)
- **Purpose**: Financial reporting and analysis
- **Planned Features**:
  - Revenue tracking
  - Expense management
  - Profit/loss calculations
  - Financial reporting and charts
  - Period-based analysis (daily, weekly, monthly, yearly)

### 4. Associates
- **Status**: 📋 Planned
- **Location**: `/stores/:id/associates` (to be implemented)
- **Purpose**: Manage store associates/users
- **Planned Features**:
  - View list of associates assigned to the store
  - Add/remove associates
  - Manage associate roles and permissions
  - Associate performance metrics
  - Associate activity tracking

## Navigation Structure

```
/stores/:id                    → Main Dashboard
/stores/:id/usage             → 1K Usage (planned)
/stores/:id/pl                → P&L (planned)
/stores/:id/associates        → Associates (planned)
```

## Implementation Notes

- Each feature section should be implemented as a separate route in the stores controller
- All sections should respect the same access control rules (users can only access their assigned stores)
- Consider implementing a sub-navigation or tabs component for easy navigation between sections
- Store context (store ID and number) should be available to all sub-sections
- Consider sharing common layout components across all store dashboard sections

## Related Files

- **Controller**: `app/controllers/stores_controller.ts`
- **Routes**: `start/routes.ts`
- **Main Dashboard Page**: `resources/js/pages/stores/dashboard.tsx`
- **Store Model**: `app/models/store.ts`
- **Sidebar Navigation**: `resources/js/components/sidebar/app-sidebar.tsx`
