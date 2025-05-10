When a user clicks on the "New Type" button in the Summary screen and then selects "Create New Summary" from the modal, the application should:

1. Generate the new summary based on the selected type and length parameters
2. Save this newly generated summary to the database
3. Immediately display the newly generated summary on the screen without requiring any additional user interaction
4. Automatically close the "Create New Summary" modal after the summary generation is complete
5. Update the UI to show the newly generated summary as the currently active summary
6. Ensure that the transition from the generation process to displaying the new summary is seamless and without delay

This feature should work consistently across all summary types and lengths available in the application.


When a user generates a new summary using the "New Type" button in the Summary screen, the "Create New Summary" modal should automatically close immediately after the summary generation is complete, without requiring any additional user interaction. Currently, the modal remains open after generation, but it should be modified to automatically dismiss itself once the new summary has been successfully generated and displayed on the screen. This change should be implemented in the `handleSaveEdit` function of the SummaryScreen component by ensuring that `setEditModalVisible(false)` is called at the appropriate time after the summary generation process completes.

When a user clicks on the "New Type" button in the Summary screen and selects a summary type and length that already exists in the database, the application should not display the "Summary Already Exists" alert popup. Instead, it should silently navigate to the existing summary without showing any notification. This change should be implemented in the `handleSaveEdit` function of the SummaryScreen component, specifically by removing or modifying the Alert.alert call that currently notifies users when they attempt to create a summary that already exists.