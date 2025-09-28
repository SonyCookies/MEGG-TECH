import tensorflow as tf
from tensorflow.keras.applications import ResNet50
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.models import Model, load_model
from tensorflow.keras.layers import GlobalAveragePooling2D, Flatten, Dense, Dropout
from tensorflow.keras.callbacks import ModelCheckpoint, ReduceLROnPlateau
import numpy as np
import splitfolders
import os

# For evaluation and plotting
from sklearn.metrics import classification_report, confusion_matrix
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt

# Paths
dataset = "D:/4THYEAR/CAPSTONE/MEGG/ai-training-backend/dataset"
dataset_dir = "D:/4THYEAR/CAPSTONE/MEGG/ai-training-backend/splitted-dataset"
saved_model = "D:/4THYEAR/CAPSTONE/MEGG/ai-training-backend/model_weights/egg_resnet50_2.keras"
real_testpath = "D:/4THYEAR/CAPSTONE/MEGG/ai-training-backend/real_test"

# Split dataset (80% Train, 10% Validation, 10% Test)
splitfolders.ratio(dataset, output=dataset_dir, seed=1337, ratio=(.8, .1, .1), move=False)
trainpath = os.path.join(dataset_dir, "train")
validpath = os.path.join(dataset_dir, "val")
testpath = os.path.join(dataset_dir, "test")

# Image Parameters
img_width, img_height = (224, 224)
batch_size = 20

# Data Generators
data_gen = ImageDataGenerator(preprocessing_function=tf.keras.applications.resnet50.preprocess_input)

train_set = data_gen.flow_from_directory(trainpath, target_size=(img_width, img_height), batch_size=batch_size, class_mode='categorical')
valid_set = data_gen.flow_from_directory(validpath, target_size=(img_width, img_height), batch_size=batch_size, class_mode='categorical', shuffle=False)
test_set = data_gen.flow_from_directory(testpath, target_size=(img_width, img_height), batch_size=batch_size, class_mode='categorical', shuffle=False)

# Load or Train Model
if os.path.exists(saved_model):
    print("Loading existing model...")
    model = load_model(saved_model)
    history = None
else:
    print("Creating new model...")
    base_model = ResNet50(input_shape=(img_width, img_height, 3), include_top=False, weights='imagenet')

    for layer in base_model.layers[:-100]:
        layer.trainable = False

    x = base_model.output
    x = GlobalAveragePooling2D()(x)
    x = Flatten()(x)
    x = Dense(1024, activation='relu')(x)
    x = Dropout(0.5)(x)
    x = Dense(512, activation='relu')(x)
    x = Dropout(0.5)(x)
    x = Dense(train_set.num_classes, activation='softmax')(x)

    model = Model(base_model.input, x)
    model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=0.000001), loss='categorical_crossentropy', metrics=['accuracy'])

    # Training Callbacks
    checkpoint = ModelCheckpoint(saved_model, monitor='val_loss', verbose=1, save_best_only=True, mode='auto')
    reduce_lr = ReduceLROnPlateau(monitor='val_loss', verbose=1, factor=0.1, patience=2, mode='auto')

    # Train Model
    epochs = 30
    history = model.fit(
        train_set,
        steps_per_epoch=train_set.samples // train_set.batch_size,
        epochs=epochs,
        validation_data=valid_set,
        validation_steps=valid_set.samples // valid_set.batch_size,
        callbacks=[checkpoint, reduce_lr]
    )

    # Save Model Properly as .keras
    os.makedirs(os.path.dirname(saved_model), exist_ok=True)
    model.save(saved_model)
    print(f"Model trained and saved to {saved_model}")

# ------------------ Evaluation ------------------ #

# Evaluate on test set
print("\n[INFO] Evaluating on test set...")
test_loss, test_acc = model.evaluate(test_set)
print(f"✅ Test Accuracy: {test_acc:.4f} | Test Loss: {test_loss:.4f}")

# Predict on test set
y_probs = model.predict(test_set)
y_pred = np.argmax(y_probs, axis=1)
y_true = test_set.classes
class_labels = list(test_set.class_indices.keys())

# Classification Report
print("\n[INFO] Generating classification report...")
report = classification_report(y_true, y_pred, target_names=class_labels, output_dict=True)
report_df = pd.DataFrame(report).transpose()
report_df.to_csv("classification_report.csv")
print("✅ classification_report.csv saved.")

# Confusion Matrix
print("[INFO] Generating confusion matrix...")
cm = confusion_matrix(y_true, y_pred)
plt.figure(figsize=(8, 6))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=class_labels, yticklabels=class_labels)
plt.title("Confusion Matrix")
plt.xlabel("Predicted")
plt.ylabel("Actual")
plt.tight_layout()
plt.savefig("confusion_matrix.png")
plt.show()
print("✅ confusion_matrix.png saved.")

# Plot training history (if model was trained now)
if history:
    print("[INFO] Plotting training curves...")
    plt.figure(figsize=(10, 4))

    # Accuracy
    plt.subplot(1, 2, 1)
    plt.plot(history.history['accuracy'], label='Train Acc')
    plt.plot(history.history['val_accuracy'], label='Val Acc')
    plt.title('Accuracy Over Epochs')
    plt.xlabel('Epoch')
    plt.ylabel('Accuracy')
    plt.legend()

    # Loss
    plt.subplot(1, 2, 2)
    plt.plot(history.history['loss'], label='Train Loss')
    plt.plot(history.history['val_loss'], label='Val Loss')
    plt.title('Loss Over Epochs')
    plt.xlabel('Epoch')
    plt.ylabel('Loss')
    plt.legend()

    plt.tight_layout()
    plt.savefig("training_curves.png")
    plt.show()
    print("✅ training_curves.png saved.")
