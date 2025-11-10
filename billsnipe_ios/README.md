# BillSnipe iOS

Native iOS application for BillSnipe - Monitor utility usage and prices, select optimal plans, and save on energy costs.

## Tech Stack

- **Framework**: SwiftUI
- **Architecture**: MVVM
- **Concurrency**: Swift async/await + Combine
- **Security**: CryptoKit for client-side encryption
- **Authentication**: Passkeys (WebAuthn)
- **Networking**: URLSession with async/await
- **Minimum iOS Version**: iOS 16.0+

## Features

- Passkey-based authentication (Face ID / Touch ID)
- Client-side AES-GCM encryption for sensitive data
- Real-time utility usage monitoring
- Savings tracking and reporting
- Secure data storage with Keychain
- Dark mode support

## Prerequisites

- macOS 13+ with Xcode 15+
- iOS 16.0+ device or simulator
- Apple Developer account (for device testing)

## Getting Started

### 1. Open in Xcode

```bash
cd billsnipe_ios
open BillSnipe.xcodeproj  # or .xcworkspace if using CocoaPods
```

### 2. Configure Signing & Capabilities

1. Select the BillSnipe target
2. Go to "Signing & Capabilities"
3. Select your development team
4. Enable the following capabilities:
   - Associated Domains (for passkeys)
   - Keychain Sharing

### 3. Configure App Settings

Update the following in your code:
- API base URL in `NetworkService.swift`
- Relying Party Identifier in `AuthService.swift`

### 4. Build and Run

- Select your target device or simulator
- Press Cmd+R to build and run

## Project Structure

```
BillSnipe/
├── BillSnipeApp.swift          # App entry point
├── Models/                     # Data models
│   └── User.swift
├── Views/                      # SwiftUI views
│   └── ContentView.swift
├── ViewModels/                 # View models
├── Services/                   # Business logic services
│   └── KeychainHelper.swift
├── Modules/
│   ├── Auth/                   # Authentication module
│   │   └── AuthService.swift
│   ├── Networking/             # Network layer
│   │   ├── NetworkService.swift
│   │   └── APIClient.swift
│   └── Crypto/                 # Encryption module
│       └── CryptoService.swift
└── Features/
    ├── SignIn/                 # Sign in feature
    │   └── SignInView.swift
    ├── Dashboard/              # Dashboard feature
    │   ├── DashboardView.swift
    │   └── DashboardViewModel.swift
    └── Settings/               # Settings feature
        └── SettingsView.swift
```

## Architecture

### MVVM Pattern

The app follows the MVVM (Model-View-ViewModel) architecture:

- **Models**: Data structures (Codable)
- **Views**: SwiftUI views
- **ViewModels**: Business logic and state management (@Published properties)

### Modules

The app is organized into feature modules:

1. **Auth Module**: Handles passkey authentication
2. **Networking Module**: API communication
3. **Crypto Module**: Client-side encryption/decryption

## Authentication

### Passkey Setup

The app uses WebAuthn/Passkeys for authentication:

1. User initiates sign-in
2. System prompts for Face ID/Touch ID
3. Credential is verified with the server
4. Session token is stored securely in Keychain

### Associated Domains

Add the following to your entitlements:

```xml
<key>com.apple.developer.associated-domains</key>
<array>
    <string>webcredentials:billsnipe.app</string>
</array>
```

## Security

### Client-Side Encryption

Sensitive data is encrypted before being sent to the server:

```swift
let cryptoService = CryptoService.shared
let (encrypted, key) = try cryptoService.encrypt(data: sensitiveData)
// Upload encrypted data to server
```

### Secure Storage

- Authentication tokens: Keychain
- Encryption keys: Keychain
- User preferences: UserDefaults (non-sensitive only)

### Key Features

- AES-GCM 256-bit encryption
- HKDF key derivation
- SHA-256 hashing
- Secure enclave integration

## API Integration

The app communicates with the backend API:

```swift
let apiClient = APIClient()

// Example: Import usage data
let result = try await apiClient.importUsage(
    accountId: "account_id",
    data: usageData
)
```

## Data Privacy

- All sensitive data is encrypted client-side
- Server only sees ciphertext
- Users can export their data
- Users can request account deletion

## Testing

### Unit Tests

```bash
Cmd+U in Xcode
```

### UI Tests

```bash
Cmd+U with UI Test target selected
```

## Deployment

### TestFlight

1. Archive the app (Product > Archive)
2. Upload to App Store Connect
3. Submit for TestFlight review
4. Invite beta testers

### App Store

1. Complete App Store Connect listing
2. Submit for review
3. Once approved, release to App Store

## Code Style

- Follow Swift API Design Guidelines
- Use SwiftLint for code formatting
- Document public APIs with comments
- Use `// MARK:` for code organization

## Common Tasks

### Adding a New Feature

1. Create a new folder in `Features/`
2. Create View and ViewModel files
3. Add navigation in `ContentView.swift`

### Adding a New API Endpoint

1. Add method to `APIClient.swift`
2. Create request/response models if needed
3. Handle errors appropriately

### Updating Dependencies

```bash
swift package update  # If using SPM
pod update           # If using CocoaPods
```

## Troubleshooting

### Passkey Not Working

- Ensure Associated Domains are configured
- Check that the Relying Party Identifier matches your domain
- Verify entitlements are correct

### Network Errors

- Check that the API base URL is correct
- Verify authentication token is being sent
- Check server logs for more details

### Build Errors

- Clean build folder (Cmd+Shift+K)
- Delete derived data
- Restart Xcode

## Requirements

- iOS 16.0+
- Xcode 15.0+
- Swift 5.9+

## Support

For issues and questions, please open an issue on GitHub.

## License

Proprietary - All rights reserved
