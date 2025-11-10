import SwiftUI

struct DashboardView: View {
    @StateObject private var viewModel = DashboardViewModel()
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // Savings Summary
                    savingsSummaryCard
                    
                    // Current Plan
                    currentPlanCard
                    
                    // Recent Activity
                    recentActivitySection
                }
                .padding()
            }
            .navigationTitle("Dashboard")
            .refreshable {
                await viewModel.refresh()
            }
            .task {
                await viewModel.loadData()
            }
            .alert("Error", isPresented: $viewModel.showError) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(viewModel.errorMessage ?? "An error occurred")
            }
        }
    }
    
    private var savingsSummaryCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Total Savings")
                .font(.headline)
                .foregroundColor(.secondary)
            
            if let totalSavings = viewModel.totalSavings {
                Text("$\(totalSavings, specifier: "%.2f")")
                    .font(.system(size: 48, weight: .bold))
                    .foregroundColor(.green)
                
                HStack {
                    Image(systemName: "arrow.up.right")
                    Text("15% from last month")
                }
                .font(.caption)
                .foregroundColor(.green)
            } else {
                ProgressView()
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.1), radius: 8, x: 0, y: 2)
    }
    
    private var currentPlanCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Current Plan")
                .font(.headline)
            
            if let account = viewModel.currentAccount {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(account.provider ?? "Unknown Provider")
                            .font(.title3)
                            .fontWeight(.semibold)
                        
                        Text(account.region)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    
                    Spacer()
                    
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.green)
                        .font(.title2)
                }
            } else {
                Button {
                    // Add account action
                } label: {
                    HStack {
                        Image(systemName: "plus.circle.fill")
                        Text("Add Utility Account")
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.1), radius: 8, x: 0, y: 2)
    }
    
    private var recentActivitySection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Recent Activity")
                .font(.headline)
            
            if viewModel.recentReports.isEmpty {
                Text("No recent activity")
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding()
            } else {
                ForEach(viewModel.recentReports) { report in
                    SavingsReportRow(report: report)
                }
            }
        }
    }
}

struct SavingsReportRow: View {
    let report: SavingsReport
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(report.month, style: .date)
                    .font(.subheadline)
                    .fontWeight(.medium)
                
                Text("Verified: \(report.verified ? "Yes" : "No")")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            VStack(alignment: .trailing, spacing: 4) {
                Text("$\(report.savings, specifier: "%.2f")")
                    .font(.headline)
                    .foregroundColor(.green)
                
                Text("saved")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 4, x: 0, y: 1)
    }
}

struct DashboardView_Previews: PreviewProvider {
    static var previews: some View {
        DashboardView()
    }
}
