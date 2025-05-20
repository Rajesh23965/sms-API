
  document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    form.reset();
    const logoPreview = document.querySelector('.img-thumbnail');
    if (logoPreview) logoPreview.src = '';
  });


document.addEventListener('DOMContentLoaded', function() {
  const imageUpload = document.getElementById('imageUpload');
  const imagePreview = document.getElementById('imagePreview');
  const imagePreviewContainer = document.getElementById('imagePreviewContainer');
  const removePreviewBtn = document.getElementById('removePreview');
  const currentImage = document.getElementById('currentImage');
  const deleteImageCheckbox = document.getElementById('deleteImage');
  const uploadError = document.getElementById('uploadError');

  const resetUploadField = () => {
    imageUpload.value = '';
    imagePreviewContainer.style.display = 'none';
    uploadError.classList.add('d-none');
  };

  const showError = (message) => {
    uploadError.textContent = message;
    uploadError.classList.remove('d-none');
    imageUpload.classList.add('is-invalid');
  };

  // Handle file selection
  imageUpload.addEventListener('change', function(e) {
    if (this.files && this.files[0]) {
      const file = this.files[0];
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      
      // Reset any previous errors
      imageUpload.classList.remove('is-invalid');
      uploadError.classList.add('d-none');

      // Validate file type
      if (!validTypes.includes(file.type)) {
        showError('Please select a valid image file (JPEG, JPG, or PNG)');
        resetUploadField();
        return;
      }
      
      // Validate file size (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        showError('Image size should be less than 2MB');
        resetUploadField();
        return;
      }
      
      const reader = new FileReader();
      
      reader.onload = function(e) {
        imagePreview.src = e.target.result;
        imagePreviewContainer.style.display = 'block';
        
        // Hide current image if exists
        if (currentImage) {
          currentImage.style.display = 'none';
        }
        
        // Uncheck delete checkbox if checked
        if (deleteImageCheckbox) {
          deleteImageCheckbox.checked = false;
        }
      }
      
      reader.readAsDataURL(file);
    }
  });
  
  // Handle remove preview button
  removePreviewBtn.addEventListener('click', function() {
    resetUploadField();
    
    // Show current image again if exists
    if (currentImage) {
      currentImage.style.display = 'block';
    }
  });
  
  // Handle delete image checkbox
  if (deleteImageCheckbox) {
    deleteImageCheckbox.addEventListener('change', function() {
      if (this.checked) {
        resetUploadField();
        if (currentImage) currentImage.style.display = 'none';
      } else if (currentImage) {
        currentImage.style.display = 'block';
      }
    });
  }
});