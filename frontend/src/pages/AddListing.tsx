import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Upload, X, Camera, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const AddListing = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const isEditing = !!editId;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    condition: '',
    tags: [] as string[],
  });

  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<{ url: string; alt: string }[]>([]);
  const [imagesToRemove, setImagesToRemove] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEditing);

  const categories = [
    'Electronics',
    'Fashion',
    'Home & Garden',
    'Sports & Outdoors',
    'Automotive',
    'Books & Media',
    'Health & Beauty',
    'Toys & Games',
    'Other'
  ];
  const conditions = ['New', 'Like New', 'Good', 'Fair', 'Poor'];

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please log in to create a listing');
      navigate('/login');
      return;
    }

    if (isEditing && editId) {
      fetchListing(editId);
    }
  }, [navigate, isEditing, editId]);

  const fetchListing = async (listingId: string) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/listings/${listingId}`);
      const listing = response.data;

      setFormData({
        title: listing.title || '',
        description: listing.description || '',
        price: listing.price?.toString() || '',
        category: listing.category || '',
        condition: listing.condition || '',
        tags: listing.tags || [],
      });

      setExistingImages(listing.images || []);
    } catch (error) {
      console.error('Error fetching listing:', error);
      toast.error('Failed to load listing for editing');
      navigate('/marketplace');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files).slice(0, 5 - images.length);
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));

      setImages(prev => [...prev, ...newFiles]);
      setImagePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => {
      // Revoke the object URL to free memory
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };



  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please log in to create a listing');
      navigate('/login');
      return;
    }

    // Validate required fields
    if (!formData.title || !formData.description || !formData.price || !formData.category || !formData.condition) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();

      // Add text fields
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('condition', formData.condition);

      // Add tags as JSON string
      if (formData.tags.length > 0) {
        formDataToSend.append('tags', JSON.stringify(formData.tags));
      }

      // Add images to remove (for editing)
      if (imagesToRemove.length > 0) {
        formDataToSend.append('removeImages', JSON.stringify(imagesToRemove));
      }

      // Add new images
      images.forEach((image) => {
        formDataToSend.append('images', image);
      });

      const url = isEditing ? `/api/listings/${editId}` : '/api/listings';
      const method = isEditing ? 'put' : 'post';

      await axios[method](url, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
      });

      toast.success(isEditing ? 'Listing updated successfully!' : 'Listing created successfully!');
      navigate('/marketplace');
    } catch (error: unknown) {
      console.error('Error saving listing:', error);
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error || `Failed to ${isEditing ? 'update' : 'create'} listing`);
      } else {
        toast.error('An unexpected error occurred');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading listing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/marketplace" className="flex items-center text-gray-600 hover:text-blue-600">
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back to Marketplace
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit Listing' : 'Create New Listing'}
            </h1>
            <p className="text-gray-600">
              {isEditing ? 'Update your listing details' : 'Share your item with fellow students'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Card className="shadow-md border-0">
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="e.g., Calculus Textbook - 8th Edition"
                        className="mt-1"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Describe your item, its condition, and any important details..."
                        className="mt-1 min-h-32"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="price">Price ($) *</Label>
                        <Input
                          id="price"
                          name="price"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.price}
                          onChange={handleInputChange}
                          placeholder="0.00"
                          className="mt-1"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="category">Category *</Label>
                        <Select value={formData.category} onValueChange={(value) => handleSelectChange('category', value)}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map(category => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="condition">Condition *</Label>
                      <Select value={formData.condition} onValueChange={(value) => handleSelectChange('condition', value)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select condition" />
                        </SelectTrigger>
                        <SelectContent>
                          {conditions.map(condition => (
                            <SelectItem key={condition} value={condition}>
                              {condition}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Images */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <Card className="shadow-md border-0">
                  <CardHeader>
                    <CardTitle>Photos</CardTitle>
                    <p className="text-sm text-gray-600">Add up to 5 photos of your item</p>
                  </CardHeader>
                  <CardContent>
                    {/* Image Upload */}
                    <div
                      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                        dragActive 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-lg font-medium text-gray-900 mb-2">
                        Drag photos here or click to browse
                      </p>
                      <p className="text-sm text-gray-500 mb-4">
                        Support JPG, PNG files up to 10MB each
                      </p>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e.target.files)}
                        className="hidden"
                        id="image-upload"
                        disabled={images.length >= 5}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('image-upload')?.click()}
                        disabled={images.length >= 5}
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Choose Files
                      </Button>
                    </div>

                    {/* Existing Images (for editing) */}
                    {isEditing && existingImages.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Current Images</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          {existingImages.map((image, index) => (
                            <div key={`existing-${index}`} className="relative group">
                              <img
                                src={image.url}
                                alt={image.alt || `Existing ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg border border-gray-200"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setImagesToRemove(prev => [...prev, image.url]);
                                  setExistingImages(prev => prev.filter((_, i) => i !== index));
                                }}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* New Image Preview */}
                    {imagePreviews.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">New Images to Add</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          {imagePreviews.map((preview, index) => (
                            <div key={`new-${index}`} className="relative group">
                              <img
                                src={preview}
                                alt={`Upload ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg border border-gray-200"
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Right Column - Additional Details */}
            <div className="space-y-6">
              {/* Tags */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card className="shadow-md border-0">
                  <CardHeader>
                    <CardTitle className="text-lg">Tags</CardTitle>
                    <p className="text-sm text-gray-600">Help buyers find your item</p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2 mb-3">
                      <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Add a tag"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      />
                      <Button type="button" onClick={addTag} size="sm">
                        Add
                      </Button>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {formData.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="gap-1">
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>



              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="space-y-3"
              >
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {isEditing ? 'Updating...' : 'Publishing...'}
                    </>
                  ) : (
                    isEditing ? 'Update Listing' : 'Publish Listing'
                  )}
                </Button>
                <Button type="button" variant="outline" className="w-full">
                  Save as Draft
                </Button>
              </motion.div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddListing;