import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var authService: AuthService
    @State private var showDeleteConfirmation = false
    @State private var showExportData = false
    
    var body: some View {
        NavigationView {
            List {
                // Account Section
                Section("Account") {
                    if let user = authService.currentUser {
                        HStack {
                            Text("Email")
                            Spacer()
                            Text(user.email)
                                .foregroundColor(.secondary)
                        }
                        
                        HStack {
                            Text("Role")
                            Spacer()
                            Text(user.role)
                                .foregroundColor(.secondary)
                        }
                    }
                }
                
                // Privacy & Data
                Section("Privacy & Data") {
                    Button {
                        showExportData = true
                    } label: {
                        HStack {
                            Image(systemName: "square.and.arrow.down")
                            Text("Export My Data")
                        }
                    }
                    
                    Button(role: .destructive) {
                        showDeleteConfirmation = true
                    } label: {
                        HStack {
                            Image(systemName: "trash")
                            Text("Delete My Account")
                        }
                    }
                }
                
                // Preferences
                Section("Preferences") {
                    NavigationLink {
                        NotificationSettingsView()
                    } label: {
                        HStack {
                            Image(systemName: "bell")
                            Text("Notifications")
                        }
                    }
                    
                    NavigationLink {
                        PrivacySettingsView()
                    } label: {
                        HStack {
                            Image(systemName: "lock")
                            Text("Privacy")
                        }
                    }
                }
                
                // About
                Section("About") {
                    HStack {
                        Text("Version")
                        Spacer()
                        Text("1.0.0")
                            .foregroundColor(.secondary)
                    }
                    
                    Link(destination: URL(string: "https://billsnipe.app/terms")!) {
                        HStack {
                            Text("Terms of Service")
                            Spacer()
                            Image(systemName: "arrow.up.right")
                                .font(.caption)
                        }
                    }
                    
                    Link(destination: URL(string: "https://billsnipe.app/privacy")!) {
                        HStack {
                            Text("Privacy Policy")
                            Spacer()
                            Image(systemName: "arrow.up.right")
                                .font(.caption)
                        }
                    }
                }
                
                // Sign Out
                Section {
                    Button(role: .destructive) {
                        authService.signOut()
                    } label: {
                        HStack {
                            Spacer()
                            Text("Sign Out")
                            Spacer()
                        }
                    }
                }
            }
            .navigationTitle("Settings")
            .confirmationDialog(
                "Delete Account",
                isPresented: $showDeleteConfirmation,
                titleVisibility: .visible
            ) {
                Button("Delete My Account", role: .destructive) {
                    deleteAccount()
                }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("This action cannot be undone. All your data will be permanently deleted.")
            }
            .sheet(isPresented: $showExportData) {
                DataExportView()
            }
        }
    }
    
    private func deleteAccount() {
        // Implementation for account deletion
        Task {
            // Call API to delete account
            authService.signOut()
        }
    }
}

// Placeholder views
struct NotificationSettingsView: View {
    var body: some View {
        Text("Notification Settings")
            .navigationTitle("Notifications")
    }
}

struct PrivacySettingsView: View {
    var body: some View {
        Text("Privacy Settings")
            .navigationTitle("Privacy")
    }
}

struct DataExportView: View {
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        NavigationView {
            VStack(spacing: 24) {
                Image(systemName: "square.and.arrow.down")
                    .font(.system(size: 64))
                    .foregroundColor(.blue)
                
                Text("Export Your Data")
                    .font(.title2)
                    .fontWeight(.bold)
                
                Text("Your data will be exported in JSON format and sent to your email address.")
                    .multilineTextAlignment(.center)
                    .foregroundColor(.secondary)
                    .padding(.horizontal)
                
                Button {
                    // Trigger data export
                    dismiss()
                } label: {
                    Text("Request Export")
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                }
                .padding(.horizontal)
            }
            .navigationTitle("Export Data")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
    }
}

struct SettingsView_Previews: PreviewProvider {
    static var previews: some View {
        SettingsView()
            .environmentObject(AuthService())
    }
}
