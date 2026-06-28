# BMW Name on Car - Open Source Web Application

## Project Overview

Build a **production-ready Open Source web application** where users can contribute money and permanently display their name on a beautiful interactive **3D BMW model**.

The application should be built with **Next.js** using a monolithic architecture where both the frontend and backend are implemented within the same Next.js application.

The primary goal is to create a visually impressive experience while maintaining enterprise-level security, scalability, and clean architecture.

---

# Technology Stack

## Frontend

* Next.js 15 (App Router)
* React 19
* TypeScript
* Tailwind CSS
* React Three Fiber
* Three.js
* Drei
* Zustand
* TanStack Query
* React Hook Form
* Zod

---

## Backend

* Next.js Route Handlers
* Prisma ORM
* PostgreSQL
* Server Components
* Server Actions (where appropriate)

---

## Infrastructure

* PostgreSQL
* Docker
* GitHub Actions
* Redis (Upstash)
* UploadThing (optional)
* Razorpay (India)
* Stripe (International)

---

# Application Goal

Visitors open the website.

Immediately they see:

* Beautiful White BMW
* Interactive 3D Viewer
* Live names already printed on the BMW

Users do **NOT** need to register.

Anyone can:

* Visit
* Rotate the BMW
* Zoom
* Inspect names
* Donate
* Add their own name
* Instantly see it on the car

---

# Authentication

Authentication should already be implemented but disabled by default.

Example:

```env
AUTH_ENABLED=false
```

When this value becomes

```env
AUTH_ENABLED=true
```

the application should automatically enable authentication and protect admin routes.

No code changes should be required.

---

# Business Logic

Minimum Contribution

```
₹50
```

No maximum contribution.

Contribution amount determines the rendered size of the name.

| Amount        | Size |
| ------------- | ---- |
| ₹50 - ₹99     | XS   |
| ₹100 - ₹199   | S    |
| ₹200 - ₹499   | M    |
| ₹500 - ₹999   | L    |
| ₹1000 - ₹2499 | XL   |
| ₹2500+        | XXL  |

Larger contributions produce larger rendered names.

---

# User Flow

User opens homepage.

↓

Views interactive BMW.

↓

Clicks

```
Add My Name
```

↓

Popup opens.

↓

User enters

* Name
* Country
* Optional Message
* Amount

↓

Validation

↓

Payment

↓

Server verifies payment

↓

Database stores donation

↓

Position allocated

↓

BMW updates live

↓

Everyone immediately sees the new name.

---

# BMW Rendering

Render a premium White BMW.

Requirements

* High quality
* Physically Based Rendering (PBR)
* HDR Environment
* Shadows
* Reflections
* Orbit Controls
* Mobile Friendly
* Desktop Friendly
* Responsive
* Smooth animation
* 60 FPS target

---

# Name Placement

Names should never overlap.

Use predefined anchor positions.

Example positions

* Hood
* Roof
* Front Door
* Rear Door
* Front Fender
* Rear Fender
* Spoiler
* Bumper
* Side Mirror
* Trunk
* Roof Edge
* Side Skirt

Each anchor supports only one name.

When every anchor becomes occupied:

Automatically create

```
BMW #2
```

When BMW #2 becomes full

Create

```
BMW #3
```

Continue infinitely.

Users can switch between

* BMW 1
* BMW 2
* BMW 3
* BMW 4

etc.

---

# Rendering Rules

Each name stores

* Position
* Rotation
* Scale
* Size
* Color (future)
* Material

Names should curve naturally with the vehicle surface if possible.

Newly added names should briefly glow or animate.

---

# Payment System

Support

## India

Razorpay

## International

Stripe

Payment Flow

User clicks Continue.

↓

Backend creates payment order.

↓

Frontend completes payment.

↓

Payment callback.

↓

Server verifies signature.

↓

Only after successful verification:

* Store donation
* Allocate BMW position
* Broadcast update

Never trust frontend payment success.

Always verify server-side.

Use payment webhooks as the final confirmation.

---

# Database Design

Use Prisma ORM.

## User (Future)

```
id
email
name
createdAt
```

---

## Donation

```
id
name
country
message
amount
currency
size
paymentStatus
paymentProvider
paymentId
bmwId
positionId
createdAt
updatedAt
```

---

## Payment

```
id
provider
orderId
paymentId
signature
status
amount
currency
createdAt
```

---

## BMW

```
id
index
status
createdAt
```

---

## Position

```
id
bmwId
coordinates
rotation
scale
occupied
createdAt
```

---

## AuditLog

```
id
action
user
metadata
createdAt
```

---

## Settings

```
id
key
value
```

---

# Security

Implement enterprise-level security.

## Validation

* Zod
* Server validation
* Input sanitization

---

## API Security

* Rate limiting
* Redis
* CSRF protection
* Secure headers
* Content Security Policy
* XSS prevention
* SQL Injection prevention
* Request validation
* Error handling
* Logging

Never expose

* API Keys
* Secrets
* Tokens

Everything must come from ENV variables.

---

# Moderation

Prevent abuse.

Implement

* Profanity filter
* Banned words
* Duplicate detection
* HTML sanitization
* Script sanitization
* Emoji restriction (optional)

Admin can

* Approve
* Reject
* Hide

Auto moderation should be configurable.

---

# Live Updates

Every browser connected to the website should instantly receive updates.

No refresh required.

Supported technologies

* Server Sent Events
* WebSockets

Whenever a donation succeeds

Broadcast

```
New Name Added
```

All clients immediately update.

---

# Homepage

Sections

Hero

Interactive BMW Viewer

Contribution CTA

Recent Contributors

Top Contributors

Leaderboard

Statistics

FAQ

Footer

---

# Statistics

Display

* Total Donations
* Total Revenue
* Total Contributors
* Average Donation
* Countries
* Active BMW Models

---

# Leaderboard

Show

Highest Donation

Newest Donations

Top Contributors

Country Rankings

Daily Contributors

Monthly Contributors

---

# Admin Panel

Route

```
/admin
```

Initially hidden.

If

```
AUTH_ENABLED=true
```

Require login.

Admin Features

Dashboard

Revenue

Payments

Donations

Search

Filter

Delete

Hide

Approve

Reject

Export CSV

Manage BMW Positions

Manage Profanity List

Manage Settings

Analytics

---

# Performance

Use

Server Components

Lazy Loading

Dynamic Imports

Image Optimization

Compression

Caching

ISR

Database Indexes

Edge Middleware (where useful)

Target

60 FPS

Fast Lighthouse Score

---

# SEO

Implement

Metadata

OpenGraph

Twitter Cards

robots.txt

sitemap.xml

Schema.org

Canonical URLs

---

# Accessibility

Keyboard Navigation

ARIA Labels

Screen Reader Support

Focus Management

High Contrast

Responsive Design

---

# Project Structure

```
app/
components/
features/
server/
lib/
hooks/
utils/
types/
prisma/
public/
styles/
```

Use Feature-Based Architecture.

---

# Coding Standards

Strict TypeScript

SOLID Principles

Repository Pattern

Service Layer

Reusable Components

No Duplicate Code

Fully Typed

Clean Architecture

Minimal Comments

Readable Code

---

# Testing

Use

Vitest

Playwright

Write

Unit Tests

Integration Tests

API Tests

Payment Verification Tests

Component Tests

---

# Docker

Provide

Dockerfile

docker-compose.yml

Production Ready

---

# CI/CD

GitHub Actions

Run automatically

* Install
* Lint
* Typecheck
* Test
* Build

---

# Documentation

Create a complete README including

Installation

Local Development

Docker Setup

Environment Variables

Architecture

Folder Structure

Database Setup

Deployment

Contribution Guide

Open Source License

---

# Future Features

Authentication

User Profiles

Contribution History

Achievements

Badges

NFT Certificate

Referral Rewards

Coupons

Subscriptions

Multiple Cars

Tesla

Ferrari

Lamborghini

Custom Colors

Custom Fonts

Multiple Languages

Dark Mode

Mobile App

---

# Scalability Improvements

Implement production-ready architecture.

* Reserve a BMW position for 5–10 minutes during payment to avoid race conditions.
* Use PostgreSQL transactions when allocating positions.
* Store BMW anchor positions in the database instead of hardcoding them.
* Support multiple currencies (INR, USD, EUR, GBP, etc.).
* Add payment webhooks for reliable confirmation.
* Add analytics for revenue, countries, conversions, and active BMW instances.
* Implement IP-based rate limiting and duplicate payment detection.
* Design the system so multiple BMW models can be added without changing the core architecture.

---

# Deliverables

Generate a complete production-ready application.

Do **NOT** generate pseudocode.

Generate all required files including

* Next.js project
* Prisma schema
* Database migrations
* Route Handlers
* APIs
* React Components
* Three.js BMW Viewer
* Payment Integration
* Admin Panel
* Tests
* Docker Configuration
* GitHub Actions
* README Documentation

The generated project should compile successfully without modification and follow enterprise-level coding standards suitable for an open-source production deployment.


A few improvements I would make to the business model

Before building, I'd make these additions to avoid abuse and improve scalability:

Reserve a position for 5–10 minutes after a payment is initiated so two people can't buy the same spot simultaneously.
Use payment webhooks as the final confirmation instead of relying only on the browser callback.
Moderate names with a profanity filter and optionally require approval before they appear.
Support multiple currencies (INR, USD, EUR, GBP) while mapping donation tiers consistently.
Add a "Lifetime" vs. "30-day" display option if the BMW eventually becomes full, giving you flexibility in how names are retained.
Use PostgreSQL transactions when assigning positions to prevent race conditions under concurrent payments.
Store 3D anchor positions in the database instead of hardcoding them, allowing you to edit positions without redeploying.
Broadcast updates in real time using Server-Sent Events or WebSockets so all visitors immediately see newly added names.
Add analytics for total donations, active BMW models, countries, conversion rate, and average donation.
Implement anti-spam protections including IP rate limiting, duplicate payment detection, bot protection, and server-side validation.