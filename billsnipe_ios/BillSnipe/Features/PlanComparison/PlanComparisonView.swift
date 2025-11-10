import SwiftUI

struct PlanComparisonView: View {
    @StateObject private var viewModel = PlanComparisonViewModel()
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Account Selection
                    if !viewModel.accounts.isEmpty {
                        accountSelectionCard
                    }
                    
                    // Current Plan
                    if let currentPlan = viewModel.currentPlan {
                        currentPlanCard(currentPlan)
                    }
                    
                    // Recommendations
                    if !viewModel.recommendations.isEmpty {
                        recommendationsSection
                    }
                    
                    // Empty State
                    if viewModel.accounts.isEmpty {
                        emptyStateView
                    }
                }
                .padding()
            }
            .navigationTitle("Compare Plans")
            .navigationBarTitleDisplayMode(.large)
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
    
    private var accountSelectionCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Select Account")
                .font(.headline)
            
            Picker("Account", selection: $viewModel.selectedAccountId) {
                ForEach(viewModel.accounts, id: \.id) { account in
                    Text("\(account.provider ?? "Unnamed") - \(account.region)")
                        .tag(account.id as String?)
                }
            }
            .pickerStyle(.menu)
            .padding()
            .background(Color(.systemGray6))
            .cornerRadius(8)
            
            Button {
                Task {
                    await viewModel.comparePlans()
                }
            } label: {
                HStack {
                    if viewModel.isLoading {
                        ProgressView()
                            .tint(.white)
                    } else {
                        Text("Compare Plans")
                    }
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.blue)
                .foregroundColor(.white)
                .cornerRadius(12)
            }
            .disabled(viewModel.isLoading || viewModel.selectedAccountId == nil)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.1), radius: 8, x: 0, y: 2)
    }
    
    private func currentPlanCard(_ plan: CurrentPlan) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                VStack(alignment: .leading) {
                    Text("Current Plan")
                        .font(.headline)
                        .foregroundColor(.secondary)
                    Text(plan.provider)
                        .font(.title2)
                        .fontWeight(.semibold)
                }
                
                Spacer()
                
                VStack(alignment: .trailing) {
                    Text("Monthly")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text("$\(plan.estimatedMonthlyCost, specifier: "%.2f")")
                        .font(.title)
                        .fontWeight(.bold)
                }
            }
        }
        .padding()
        .background(Color.blue.opacity(0.1))
        .cornerRadius(16)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.blue, lineWidth: 2)
        )
    }
    
    private var recommendationsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Recommended Plans")
                .font(.title2)
                .fontWeight(.bold)
            
            ForEach(Array(viewModel.recommendations.enumerated()), id: \.element.planId) { index, plan in
                PlanRecommendationCard(plan: plan, isBest: index == 0)
            }
        }
    }
    
    private var emptyStateView: some View {
        VStack(spacing: 20) {
            Image(systemName: "chart.bar.doc.horizontal")
                .font(.system(size: 64))
                .foregroundColor(.secondary)
            
            Text("No Accounts Available")
                .font(.title2)
                .fontWeight(.semibold)
            
            Text("Add a utility account to start comparing plans")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding()
    }
}

struct PlanRecommendationCard: View {
    let plan: PlanRecommendation
    let isBest: Bool
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            if isBest {
                HStack {
                    Text("Best Savings")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 4)
                        .background(Color.green)
                        .cornerRadius(12)
                    Spacer()
                }
            }
            
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(plan.planName)
                        .font(.headline)
                    Text(plan.provider)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
            }
            
            HStack(spacing: 20) {
                VStack(alignment: .leading) {
                    Text("Monthly")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text("$\(plan.estimatedMonthlyCost, specifier: "%.2f")")
                        .font(.title3)
                        .fontWeight(.semibold)
                }
                
                Divider()
                    .frame(height: 40)
                
                VStack(alignment: .leading) {
                    Text("Annual Savings")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text("$\(plan.estimatedAnnualSavings, specifier: "%.2f")")
                        .font(.title3)
                        .fontWeight(.semibold)
                        .foregroundColor(.green)
                }
            }
            
            if !plan.features.isEmpty {
                VStack(alignment: .leading, spacing: 6) {
                    Text("Features")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundColor(.secondary)
                    
                    ForEach(plan.features, id: \.self) { feature in
                        HStack(spacing: 6) {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundColor(.green)
                                .font(.caption)
                            Text(feature)
                                .font(.caption)
                        }
                    }
                }
            }
            
            Button {
                // Switch to plan action
            } label: {
                Text("Switch to This Plan")
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(isBest ? Color.blue : Color.blue.opacity(0.2))
                    .foregroundColor(isBest ? .white : .blue)
                    .cornerRadius(12)
            }
        }
        .padding()
        .background(isBest ? Color.green.opacity(0.05) : Color(.systemBackground))
        .cornerRadius(16)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(isBest ? Color.green : Color(.systemGray4), lineWidth: isBest ? 2 : 1)
        )
        .shadow(color: Color.black.opacity(0.05), radius: 4, x: 0, y: 2)
    }
}

struct CurrentPlan {
    let provider: String
    let estimatedMonthlyCost: Double
}

struct PlanRecommendation: Codable {
    let planId: String
    let planName: String
    let provider: String
    let estimatedMonthlyCost: Double
    let estimatedAnnualSavings: Double
    let planType: String
    let features: [String]
}
