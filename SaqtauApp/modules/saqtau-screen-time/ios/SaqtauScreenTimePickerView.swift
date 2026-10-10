import FamilyControls
import SwiftUI

struct SaqtauScreenTimePickerView: View {
  @State private var selection: FamilyActivitySelection
  let onSave: (FamilyActivitySelection) -> Void
  let onCancel: () -> Void

  init(
    selection: FamilyActivitySelection,
    onSave: @escaping (FamilyActivitySelection) -> Void,
    onCancel: @escaping () -> Void
  ) {
    _selection = State(initialValue: selection)
    self.onSave = onSave
    self.onCancel = onCancel
  }

  var body: some View {
    NavigationStack {
      FamilyActivityPicker(selection: $selection)
        .navigationTitle("Choose apps")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
          ToolbarItem(placement: .cancellationAction) {
            Button("Cancel") {
              onCancel()
            }
          }
          ToolbarItem(placement: .confirmationAction) {
            Button("Done") {
              onSave(selection)
            }
          }
        }
    }
  }
}
