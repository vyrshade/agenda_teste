const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export const uploadToCloudinary = async (imageUri: string) => {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    console.error("Cloudinary não configurado: defina EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME e EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET");
    return null;
  }

  const data = new FormData();

  data.append('file', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'profile_pic.jpg',
  } as any); 

  data.append('upload_preset', UPLOAD_PRESET);

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: data,
    });

    const result = await response.json();

    if (result.secure_url) {
      return result.secure_url; 
    } else {
      console.error("Erro Cloudinary:", result);
      return null;
    }
  } catch (error) {
    console.error("Erro no upload:", error);
    return null;
  }
};