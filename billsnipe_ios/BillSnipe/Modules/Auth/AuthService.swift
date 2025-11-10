import Foundation
import AuthenticationServices
import Combine

@MainActor
class AuthService: NSObject, ObservableObject {
    @Published var isAuthenticated = false
    @Published var currentUser: User?
    @Published var errorMessage: String?
    
    private let networkService = NetworkService.shared
    
    override init() {
        super.init()
        checkAuthenticationStatus()
    }
    
    func checkAuthenticationStatus() {
        // Check if user has valid session token
        if let token = KeychainHelper.shared.getToken() {
            self.isAuthenticated = true
            // Fetch user data
            Task {
                await fetchCurrentUser()
            }
        }
    }
    
    func signInWithPasskey() async {
        do {
            let provider = ASAuthorizationPlatformPublicKeyCredentialProvider(
                relyingPartyIdentifier: "billsnipe.app"
            )
            
            // Request authentication
            let request = provider.createCredentialAssertionRequest(
                challenge: Data() // In production, get challenge from server
            )
            
            let authController = ASAuthorizationController(authorizationRequests: [request])
            authController.delegate = self
            authController.performRequests()
            
        } catch {
            self.errorMessage = "Failed to sign in: \(error.localizedDescription)"
        }
    }
    
    func signOut() {
        KeychainHelper.shared.deleteToken()
        self.isAuthenticated = false
        self.currentUser = nil
    }
    
    private func fetchCurrentUser() async {
        // Implementation to fetch user from API
    }
}

// MARK: - ASAuthorizationControllerDelegate
extension AuthService: ASAuthorizationControllerDelegate {
    func authorizationController(
        controller: ASAuthorizationController,
        didCompleteWithAuthorization authorization: ASAuthorization
    ) {
        if let credential = authorization.credential as? ASAuthorizationPlatformPublicKeyCredentialAssertion {
            // Handle successful authentication
            Task {
                await handleSuccessfulAuth(credential: credential)
            }
        }
    }
    
    func authorizationController(
        controller: ASAuthorizationController,
        didCompleteWithError error: Error
    ) {
        self.errorMessage = "Authentication failed: \(error.localizedDescription)"
    }
    
    private func handleSuccessfulAuth(
        credential: ASAuthorizationPlatformPublicKeyCredentialAssertion
    ) async {
        // Send credential to server and get token
        // Store token in keychain
        // Update authentication state
        self.isAuthenticated = true
    }
}
