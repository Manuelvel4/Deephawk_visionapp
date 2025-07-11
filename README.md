The app architecture is as follows:

<img width="1135" height="675" alt="image" src="https://github.com/user-attachments/assets/4fedce4b-fe54-40b3-b1a3-f0ae6e8e6f99" />

And the database architecture is as follows:

<img width="1252" height="670" alt="image" src="https://github.com/user-attachments/assets/7f2e4357-5b3a-4066-8909-cd02868627e3" />

Let me show you a demo app:

Below are the final results obtained after developing the application, showing the main screens and implemented functionalities. The typical usage flow is detailed—from accessing the platform to utilizing trained artificial vision models.

8.1. Main Screen / Login
When the application starts, the user is taken to the main screen, which offers three primary options:
• Log in: For already registered users.
• Sign up: For new users.

<img width="940" height="472" alt="image" src="https://github.com/user-attachments/assets/d9fd96c9-74c7-4a6d-800a-809df859f915" />


8.2. User Registration Screen
Upon selecting the sign-up option, the user is directed to the registration screen.
This form asks for:
• Email: Must be valid and unique.
• Password: Must have at least 8 characters.
• Password confirmation: To ensure there are no typing errors.
After completing and submitting the form, the system validates the entered data. If the data is correct and no user exists with that email, the account is created and the user is notified that they can log in.

<img width="851" height="426" alt="image" src="https://github.com/user-attachments/assets/98e536e9-38d8-4d80-a5da-5dda7c9c09f7" />

In case of errors (email already in use, passwords mismatch, etc.), the application displays clear messages so the user can correct them.

8.3. Main Screen After Login
Once authenticated correctly, the user is taken to the application’s main screen.
In this view, the user can:
• View the list of their existing projects.
• Create a new project via a prominent button.
• Edit or delete previous projects.
• Access their user profile (where they can view or modify personal information).
• Log out.
The interface is designed to be clean, minimalist, and allows intuitive navigation between projects and core functionalities. From this screen, the user can choose one of their projects to work on, upload images, label them, train models, or test them in real time.

8.4. Image Management and Labeling Screen
After creating or selecting a project, the user accesses the image management screen.
Here they can:
• Upload new images to the project from their device.
• View the list of uploaded images with thumbnails and names.
• Delete images that are no longer needed.
• Select an image to begin the labeling process.
Upon selecting an image, the application presents an interactive labeling interface based on a canvas, where the user can:
• Draw bounding boxes over objects of interest in the image.
• Assign a textual class or label to each box (for example: “defective part,” “connector,” etc.).
• Edit or delete existing labels at any time before saving.
• Save the changes, which are then associated with the image in the database.

<img width="915" height="469" alt="image" src="https://github.com/user-attachments/assets/5e280d36-5fcb-44a5-bb0b-5fcba126d187" />

This screen is key in the workflow, as it allows for easily and intuitively generating labeled datasets, facilitating subsequent training of the vision models.

8.5. Model Training Screen
Once the user has uploaded and labeled enough images in their project, they access the model training screen.
On this screen, the user can:
• Select the set of images and labels to use for model training.
• Configure basic training parameters (e.g., model name, YOLO model type, number of epochs, etc.).
• Start the training process by clicking a specific button.
During training:
• A progress indicator is displayed (loading bar, percentage, real-time logs, or status notifications).
• The user can view relevant information, such as the number of images used, detected classes, and estimated remaining time.

<img width="915" height="467" alt="image" src="https://github.com/user-attachments/assets/e5f5c5e5-fc7b-4a84-a8d2-7744056541c2" />

 
When training finishes:
• The application notifies the user that the model is ready.
• A summary of obtained metrics (accuracy, loss, etc.) is shown, along with the possibility to download the model or use it directly for making predictions.

<img width="940" height="479" alt="image" src="https://github.com/user-attachments/assets/d1ab8185-cd87-44a7-b859-50f64b586f7c" />

This screen is essential for creating custom models adapted to each project’s needs, allowing users to leverage their own datasets.

8.6. “Test Mode” Screen (Real-Time Camera Testing Mode)
The “Test Mode” functionality in Deephawk allows users to connect a camera to the system and evaluate the trained YOLO model in real time over the video stream.
Operational flow according to Deephawk’s code:

Model selection:
• The user chooses the YOLO model they wish to test, among previously trained and stored models.

Camera connection:
• The user activates the camera through the interface (browser permission or device selection).
• The frontend initiates the video stream, displaying the live image.

Activating test mode:
• The user activates “Test Mode.”
• The system continuously captures frames from the camera and sends them to the inference backend/microservice via HTTP or WebSocket requests.

Real-time inference:
• The microservice receives the frames, executes inference with the selected YOLO model, and returns the results (bounding box coordinates, detected classes, etc.).
• The frontend receives detection data and draws boxes and labels in real time on the image.

Visualization and control:
• The user can pause the camera, switch models, adjust the confidence threshold, or capture result snapshots.
• The flow allows the rapid validation of whether the model correctly detects objects in different conditions.

Saving images:
• The user can save captured images in the selected project to retrain the model with newly saved images.

<img width="961" height="489" alt="image" src="https://github.com/user-attachments/assets/c844c851-5a6d-435b-b22e-08a7c8399bf6" />
