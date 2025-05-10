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

divide the frontend\src\screens\HistoryScreen.js,frontend\src\screens\HomeScreen.js,frontend\src\screens\QAScreen.js in modular pieces

frontend\src\screens\HistoryScreen.js,frontend\src\screens\HomeScreen.js,frontend\src\screens\QAScreen.js, frontend\src\screens\SummaryScreen.js

Refactor the frontend\src\screens\SummaryScreen.js component by dividing it into smaller, modular components to improve code organization and maintainability. Create separate component files for logical UI sections . Ensure each component has clear props interfaces, maintains the existing functionality, and follows React Native best practices. Update imports and exports accordingly to maintain the application's current behavior while improving its structure.

don't remove the text label from the test button.

Please modify the API key management UI to keep the text label "Test" on the Test button while removing text labels only from the Save and Clear buttons. The Test button should continue to display both the checkmark-circle icon and the "Test" text label, maintaining its original appearance, while the Save and Clear buttons should be changed to show only their respective icons.


In the file `frontend\src\screens\SummaryScreen.js`, please modify the API key management UI buttons as follows:

1. For the "Test" button:
   - Keep both the checkmark-circle icon AND the "Test" text label
   - Do not change its current appearance or functionality

2. For the "Save" button:
   - Remove ONLY the text label, keeping the icon
   - Maintain the same size, position, and functionality

3. For the "Clear" button:
   - Remove ONLY the text label, keeping the icon
   - Maintain the same size, position, and functionality

Please ensure that all button functionality remains unchanged, and only the visual appearance of the Save and Clear buttons is modified by removing their text labels while preserving their icons.