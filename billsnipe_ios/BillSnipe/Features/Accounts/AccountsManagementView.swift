import SwiftUI

struct AccountsManagementView: View {
    @StateObject private var viewModel = AccountsViewModel()
    @State private var showAddAccount = false
    
    var body: some View {
        NavigationView {
            Group {
                if viewModel.accounts.isEmpty && !viewModel.isLoading {
                    emptyStateView
                } else {
                    accountsList
                }
            }
            .navigationTitle("Accounts")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showAddAccount = true
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showAddAccount) {
                AddAccountView(viewModel: viewModel)
            }
            .task {
                await viewModel.loadAccounts()
            }
            .alert("Error", isPresented: $viewModel.showError) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(viewModel.errorMessage ?? "An error occurred")
            }
        }
    }
    
    private var accountsList: some View {
        List {
            ForEach(viewModel.accounts, id: \.id) { account in
                AccountRow(account: account)
            }
        }
        .listStyle(.insetGrouped)
        .refreshable {
            await viewModel.loadAccounts()
        }
    }
    
    private var emptyStateView: some View {
        VStack(spacing: 24) {
            Image(systemName: "bolt.circle")
                .font(.system(size: 80))
                .foregroundColor(.blue)
            
            VStack(spacing: 8) {
                Text("No Accounts")
                    .font(.title2)
                    .fontWeight(.bold)
                
                Text("Add your first utility account to start tracking savings")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
            }
            
            Button {
                showAddAccount = true
            } label: {
                Label("Add Account", systemImage: "plus")
                    .frame(maxWidth: 200)
                    .padding()
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(12)
            }
        }
        .padding()
    }
}

struct AccountRow: View {
    let account: UtilityAccount
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(account.provider ?? "Unnamed Account")
                        .font(.headline)
                    Text(account.region)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                StatusBadge(status: account.status)
            }
            
            if let accountNumber = account.accountNumber {
                Text("Account: \(accountNumber)")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 4)
    }
}

struct StatusBadge: View {
    let status: String
    
    var body: some View {
        Text(status.capitalized)
            .font(.caption)
            .fontWeight(.semibold)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(status == "active" ? Color.green.opacity(0.2) : Color.gray.opacity(0.2))
            .foregroundColor(status == "active" ? .green : .gray)
            .cornerRadius(8)
    }
}

struct AddAccountView: View {
    @Environment(\.dismiss) var dismiss
    @ObservedObject var viewModel: AccountsViewModel
    
    @State private var region = ""
    @State private var provider = ""
    @State private var accountNumber = ""
    @State private var isSubmitting = false
    
    var body: some View {
        NavigationView {
            Form {
                Section {
                    TextField("Region (e.g., Ontario, Texas)", text: $region)
                    TextField("Provider (optional)", text: $provider)
                    TextField("Account Number (optional)", text: $accountNumber)
                } header: {
                    Text("Account Details")
                } footer: {
                    Text("Add your utility account details to start tracking savings")
                }
            }
            .navigationTitle("Add Account")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .confirmationAction) {
                    Button("Add") {
                        Task {
                            await addAccount()
                        }
                    }
                    .disabled(region.isEmpty || isSubmitting)
                }
            }
        }
    }
    
    private func addAccount() async {
        isSubmitting = true
        defer { isSubmitting = false }
        
        await viewModel.createAccount(
            region: region,
            provider: provider.isEmpty ? nil : provider,
            accountNumber: accountNumber.isEmpty ? nil : accountNumber
        )
        
        if !viewModel.showError {
            dismiss()
        }
    }
}

@MainActor
class AccountsViewModel: ObservableObject {
    @Published var accounts: [UtilityAccount] = []
    @Published var isLoading = false
    @Published var showError = false
    @Published var errorMessage: String?
    
    private let apiClient = APIClient()
    
    func loadAccounts() async {
        isLoading = true
        defer { isLoading = false }
        
        do {
            accounts = try await apiClient.getAccounts()
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
    }
    
    func createAccount(region: String, provider: String?, accountNumber: String?) async {
        do {
            let newAccount = try await apiClient.createAccount(
                region: region,
                provider: provider,
                accountNumber: accountNumber
            )
            accounts.append(newAccount)
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
    }
}
