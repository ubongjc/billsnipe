import SwiftUI
import AuthenticationServices

struct SignInView: View {
    @EnvironmentObject var authService: AuthService
    @State private var isLoading = false
    @State private var showError = false
    
    var body: some View {
        VStack(spacing: 32) {
            Spacer()
            
            // Logo and Title
            VStack(spacing: 16) {
                Image(systemName: "bolt.fill")
                    .font(.system(size: 64))
                    .foregroundColor(.blue)
                
                Text("BillSnipe")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                
                Text("Monitor usage, optimize plans,\nsave on energy costs")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
            
            Spacer()
            
            // Sign In Button
            VStack(spacing: 16) {
                Button {
                    signIn()
                } label: {
                    HStack {
                        if isLoading {
                            ProgressView()
                                .tint(.white)
                        } else {
                            Image(systemName: "faceid")
                            Text("Sign in with Passkey")
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(12)
                }
                .disabled(isLoading)
                
                Text("Secure authentication with Face ID or Touch ID")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .padding(.horizontal, 32)
            .padding(.bottom, 48)
        }
        .alert("Sign In Error", isPresented: $showError) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(authService.errorMessage ?? "An unknown error occurred")
        }
    }
    
    private func signIn() {
        isLoading = true
        
        Task {
            await authService.signInWithPasskey()
            isLoading = false
            
            if authService.errorMessage != nil {
                showError = true
            }
        }
    }
}

struct SignInView_Previews: PreviewProvider {
    static var previews: some View {
        SignInView()
            .environmentObject(AuthService())
    }
}
