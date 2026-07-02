import React, { useState } from "react";
import {
  Edit,
  Trash2,
  Plus,
  Check,
  X,
  Image,
  Wifi,
  Coffee,
  Tv,
  Bed,
  Bath,
  Snowflake,
  Lock,
  FireExtinguisher,
  Armchair,
  Plug,
  UtensilsCrossed,
  VolumeX,
} from "lucide-react";
import Footer from "../../layouts/Footer";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/shared/components/card";
import { Button } from "@/shared/components/button";
import { Input } from "@/shared/components/input";
import { Textarea } from "@/shared/components/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/select";
import { Checkbox } from "@/shared/components/checkbox";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Label } from "@/shared/components/label";
import { Separator } from "@/shared/components/separator";

const RoomManagement = () => {
  const [hotel, setHotel] = useState({
    id: 1,
    name: "Taj Tashi Thimphu",
    location: "Thimphu, Bhutan",
    rooms: [
      {
        id: 1,
        type: "Deluxe Room",
        description: "Spacious room with king bed and mountain views",
        price: 220,
        maxGuests: 2,
        active: true,
        photos: [
          "https://images.unsplash.com/photo-1582719471380-cd7775af7d73?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
        ],
        amenities: [
          { id: 1, name: "King Bed", icon: "bed", type: "bed" },
          { id: 2, name: "Smart TV", icon: "tv", type: "electronics" },
          { id: 3, name: "Wi-Fi", icon: "wifi", type: "electronics" },
          { id: 4, name: "Attached Bathroom", icon: "bath", type: "bathroom" },
        ],
      },
      {
        id: 2,
        type: "Suite",
        description: "Luxurious suite with separate living area",
        price: 350,
        maxGuests: 3,
        active: true,
        photos: [
          "https://images.unsplash.com/photo-1564501049412-61c2a3083791?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
        ],
        amenities: [
          { id: 1, name: "King Bed", icon: "bed", type: "bed" },
          { id: 5, name: "Air Conditioning", icon: "ac", type: "comfort" },
          { id: 6, name: "Safe Locker", icon: "safe", type: "security" },
          { id: 7, name: "Balcony", icon: "balcony", type: "view" },
        ],
      },
    ],
  });

  const [showRoomForm, setShowRoomForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [roomForm, setRoomForm] = useState({
    type: "",
    description: "",
    price: "",
    maxGuests: 1,
    active: true,
    photos: [],
    amenities: [],
  });
  const [newAmenity, setNewAmenity] = useState({
    name: "",
    icon: "",
    type: "",
  });
  const [showAmenityForm, setShowAmenityForm] = useState(false);

  const form = useForm({
    defaultValues: roomForm,
  });

  const standardAmenities = [
    { id: 1, name: "Single Bed", icon: <Bed size={18} />, type: "bed" },
    { id: 2, name: "Double Bed", icon: <Bed size={18} />, type: "bed" },
    { id: 3, name: "Queen Bed", icon: <Bed size={18} />, type: "bed" },
    { id: 4, name: "King Bed", icon: <Bed size={18} />, type: "bed" },
    { id: 5, name: "Smart TV", icon: <Tv size={18} />, type: "electronics" },
    { id: 6, name: "Normal TV", icon: <Tv size={18} />, type: "electronics" },
    { id: 7, name: "Wi-Fi", icon: <Wifi size={18} />, type: "electronics" },
    { id: 8, name: "Attached Bathroom", icon: <Bath size={18} />, type: "bathroom" },
    { id: 9, name: "Electric Kettle", icon: <Coffee size={18} />, type: "comfort" },
    {
      id: 10,
      name: "Air Conditioning",
      icon: <Snowflake size={18} />,
      type: "comfort",
    },
    {
      id: 11,
      name: "Charging Ports",
      icon: <Plug size={18} />,
      type: "electronics",
    },
    { id: 12, name: "Mirror", icon: <UtensilsCrossed size={18} />, type: "bathroom" },
    {
      id: 13,
      name: "Wardrobe/Closet",
      icon: <UtensilsCrossed size={18} />,
      type: "furniture",
    },
    {
      id: 14,
      name: "Table & Chairs",
      icon: <UtensilsCrossed size={18} />,
      type: "furniture",
    },
    { id: 15, name: "Towel/Toiletries", icon: <Armchair size={18} />, type: "bathroom" },
    { id: 16, name: "Safe Locker", icon: <Lock size={18} />, type: "security" },
    {
      id: 17,
      name: "Fire Extinguisher",
      icon: <FireExtinguisher size={18} />,
      type: "security",
    },
    { id: 18, name: "Balcony", icon: <Armchair size={18} />, type: "view" },
    { id: 19, name: "Soundproofing", icon: <VolumeX size={18} />, type: "comfort" },
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setRoomForm({
      ...roomForm,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleAmenityChange = (e) => {
    const { name, value } = e.target;
    setNewAmenity({
      ...newAmenity,
      [name]: value,
    });
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate file sizes (4MB limit per file)
    const maxFileSize = 4 * 1024 * 1024; // 4MB in bytes
    const oversizedFiles = files.filter(file => file.size > maxFileSize);
    
    if (oversizedFiles.length > 0) {
      const fileNames = oversizedFiles.map(file => file.name).join(', ');
      toast({
        title: "File size too large",
        description: `${fileNames} - Each image must be smaller than 4MB. Please compress your images and try again.`,
        variant: "destructive",
      });
      return;
    }

    const newPhotos = files.map((file) => URL.createObjectURL(file));
    setRoomForm({
      ...roomForm,
      photos: [...roomForm.photos, ...newPhotos],
    });
    form.setValue("photos", [...roomForm.photos, ...newPhotos]);
  };

  const removePhoto = (index) => {
    setRoomForm({
      ...roomForm,
      photos: roomForm.photos.filter((_, i) => i !== index),
    });
    form.setValue(
      "photos",
      roomForm.photos.filter((_, i) => i !== index)
    );
  };

  const toggleAmenity = (amenity) => {
    const isSelected = roomForm.amenities.some((a) => a.name === amenity.name);
    let updatedAmenities;
    if (isSelected) {
      updatedAmenities = roomForm.amenities.filter(
        (a) => a.name !== amenity.name
      );
    } else {
      updatedAmenities = [...roomForm.amenities, amenity];
    }
    setRoomForm({
      ...roomForm,
      amenities: updatedAmenities,
    });
    form.setValue("amenities", updatedAmenities);
  };

  const addCustomAmenity = () => {
    if (newAmenity.name.trim() === "") return;

    const updatedAmenities = [
      ...roomForm.amenities,
      {
        id: Date.now(),
        name: newAmenity.name,
        icon: "custom",
        type: newAmenity.type || "other",
      },
    ];

    setRoomForm({
      ...roomForm,
      amenities: updatedAmenities,
    });
    form.setValue("amenities", updatedAmenities);
    setNewAmenity({ name: "", icon: "", type: "" });
    setShowAmenityForm(false);
  };

  const startEditRoom = (room) => {
    setEditingRoom(room.id);
    const roomToEdit = {
      type: room.type,
      description: room.description,
      price: room.price,
      maxGuests: room.maxGuests,
      active: room.active,
      photos: [...room.photos],
      amenities: [...room.amenities],
    };
    setRoomForm(roomToEdit);
    form.reset(roomToEdit);
    setShowRoomForm(true);
  };

  const cancelEdit = () => {
    setEditingRoom(null);
    setShowRoomForm(false);
    resetForm();
  };

  const resetForm = () => {
    const defaultForm = {
      type: "",
      description: "",
      price: "",
      maxGuests: 1,
      active: true,
      photos: [],
      amenities: [],
    };
    setRoomForm(defaultForm);
    form.reset(defaultForm);
  };

  const onSubmit = (values) => {
    if (!values.type || !values.description || !values.price) {
      toast({
        title: "Error",
        description: "Please fill all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (editingRoom) {
      const updatedRooms = hotel.rooms.map((room) =>
        room.id === editingRoom ? { ...values, id: editingRoom } : room
      );
      setHotel({ ...hotel, rooms: updatedRooms });
      toast({
        title: "Success",
        description: "Room updated successfully.",
      });
    } else {
      const newRoom = {
        ...values,
        id: Date.now(),
      };
      setHotel({ ...hotel, rooms: [...hotel.rooms, newRoom] });
      toast({
        title: "Success",
        description: "Room added successfully.",
      });
    }

    cancelEdit();
  };

  const deleteRoom = (id) => {
    toast({
      title: "Are you sure?",
      description: "This action cannot be undone.",
      variant: "destructive",
      action: (
        <ToastAction
          altText="Delete"
          onClick={() => {
            setHotel({
              ...hotel,
              rooms: hotel.rooms.filter((room) => room.id !== id),
            });
            toast({
              title: "Room deleted successfully.",
            });
          }}
        >
          Delete
        </ToastAction>
      ),
    });
  };

  const getIconComponent = (iconName) => {
    switch (iconName) {
      case "bed":
        return <FaBed />;
      case "tv":
        return <FiTv />;
      case "wifi":
        return <FiWifi />;
      case "bath":
        return <FaBath />;
      case "ac":
        return <FaSnowflake />;
      case "safe":
        return <FaLock />;
      case "balcony":
        return <MdBalcony />;
      case "charging":
        return <MdChargingStation />;
      case "mirror":
        return <MdTableRestaurant />;
      case "wardrobe":
        return <MdTableRestaurant />;
      case "table":
        return <MdTableRestaurant />;
      case "towel":
        return <MdBalcony />;
      case "fire":
        return <FaFireExtinguisher />;
      case "sound":
        return <IoVolumeMute />;
      case "kettle":
        return <FiCoffee />;
      default:
        return <Check size={16} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-800">
            {hotel.name}
          </CardTitle>
          <CardDescription className="text-gray-600 flex items-center">
            <MdTableRestaurant className="mr-1" /> {hotel.location}
          </CardDescription>
        </CardHeader>
      </Card>

      {showRoomForm ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">
              {editingRoom ? "Edit Room" : "Add New Room"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Room Type *</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            setRoomForm((prev) => ({ ...prev, type: value }));
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Room Type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Single Room">
                              Single Room
                            </SelectItem>
                            <SelectItem value="Double Room">
                              Double Room
                            </SelectItem>
                            <SelectItem value="Deluxe Room">
                              Deluxe Room
                            </SelectItem>
                            <SelectItem value="Suite">Suite</SelectItem>
                            <SelectItem value="Family Room">
                              Family Room
                            </SelectItem>
                            <SelectItem value="Executive Room">
                              Executive Room
                            </SelectItem>
                            <SelectItem value="Presidential Suite">
                              Presidential Suite
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price per night (Nu.) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter price"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              handleInputChange(e);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxGuests"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Guests *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="10"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              handleInputChange(e);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              setRoomForm((prev) => ({
                                ...prev,
                                active: checked,
                              }));
                            }}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Room Active</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Description *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the room features, view, size, etc."
                            rows={3}
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              handleInputChange(e);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="md:col-span-2">
                    <Label className="block text-sm font-medium text-gray-700 mb-1">
                      Photos
                    </Label>
                    <div className="flex flex-wrap gap-3 mb-3">
                      {roomForm.photos.map((photo, index) => (
                        <div key={index} className="relative">
                          <img
                            src={photo}
                            alt={`Preview ${index}`}
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                          <Button
                            type="button"
                            onClick={() => removePhoto(index)}
                            className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs"
                            variant="destructive"
                            size="icon"
                          >
                            <X size={16} />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Label
                      htmlFor="photo-upload"
                      className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-amber-400 transition"
                    >
                      <Image className="text-amber-500 text-2xl mb-2" />
                      <p className="text-sm text-gray-600">
                        Upload room photos (5 max)
                      </p>
                      <Input
                        id="photo-upload"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        disabled={roomForm.photos.length >= 5}
                      />
                    </Label>
                    {roomForm.photos.length >= 5 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Maximum 5 photos reached
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <Label className="block text-sm font-medium text-gray-700 mb-2">
                      Room Amenities
                    </Label>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
                      {standardAmenities.map((amenity) => (
                        <Button
                          key={amenity.id}
                          type="button"
                          variant={
                            roomForm.amenities.some(
                              (a) => a.name === amenity.name
                            )
                              ? "default"
                              : "outline"
                          }
                          onClick={() => toggleAmenity(amenity)}
                          className={`flex items-center justify-start p-2 h-auto ${
                            roomForm.amenities.some(
                              (a) => a.name === amenity.name
                            )
                              ? "bg-amber-500 text-white"
                              : ""
                          }`}
                        >
                          <span className="mr-2">{amenity.icon}</span>
                          <span className="text-sm">{amenity.name}</span>
                        </Button>
                      ))}
                    </div>

                    {showAmenityForm ? (
                      <Card className="p-3 mb-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2">
                          <div>
                            <Label className="block text-xs text-gray-500 mb-1">
                              Name
                            </Label>
                            <Input
                              type="text"
                              name="name"
                              value={newAmenity.name}
                              onChange={handleAmenityChange}
                              placeholder="e.g., Mini Fridge"
                            />
                          </div>
                          <div>
                            <Label className="block text-xs text-gray-500 mb-1">
                              Type
                            </Label>
                            <Select
                              name="type"
                              value={newAmenity.type}
                              onValueChange={(value) =>
                                handleAmenityChange({
                                  target: { name: "type", value },
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select Type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="furniture">
                                  Furniture
                                </SelectItem>
                                <SelectItem value="electronics">
                                  Electronics
                                </SelectItem>
                                <SelectItem value="bathroom">
                                  Bathroom
                                </SelectItem>
                                <SelectItem value="comfort">Comfort</SelectItem>
                                <SelectItem value="view">View</SelectItem>
                                <SelectItem value="security">
                                  Security
                                </SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-end gap-2">
                            <Button
                              type="button"
                              onClick={addCustomAmenity}
                              size="sm"
                            >
                              Add
                            </Button>
                            <Button
                              type="button"
                              onClick={() => setShowAmenityForm(false)}
                              variant="outline"
                              size="sm"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ) : (
                      <Button
                        type="button"
                        variant="link"
                        onClick={() => setShowAmenityForm(true)}
                        className="p-0 h-auto"
                      >
                        <Plus className="mr-1" size={16} /> Add Custom Amenity
                      </Button>
                    )}

                    {roomForm.amenities.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          Selected Amenities
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {roomForm.amenities.map((amenity, index) => (
                            <div
                              key={index}
                              className="flex items-center bg-amber-50 px-3 py-1 rounded-full text-sm"
                            >
                              {amenity.icon !== "custom" ? (
                                <span className="text-amber-500 mr-1">
                                  {getIconComponent(amenity.icon)}
                                </span>
                              ) : (
                                <span className="text-amber-500 mr-1">
                                  <Check size={16} />
                                </span>
                              )}
                              {amenity.name}
                              <Button
                                type="button"
                                onClick={() => toggleAmenity(amenity)}
                                variant="ghost"
                                size="icon"
                                className="ml-1 h-5 w-5"
                              >
                                <X size={14} />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={cancelEdit}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingRoom ? "Update Room" : "Save Room"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      ) : (
        <Button
          onClick={() => {
            setShowRoomForm(true);
            setEditingRoom(null);
            resetForm();
          }}
          className="mb-6"
        >
          <Plus className="mr-2" size={18} /> Add New Room
        </Button>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Your Rooms ({hotel.rooms.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {hotel.rooms.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No rooms added yet. Click "Add New Room" to get started.
            </div>
          ) : (
            <div className="divide-y">
              {hotel.rooms.map((room) => (
                <div key={room.id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex flex-col md:flex-row md:items-center gap-6">
                    {room.photos.length > 0 && (
                      <div className="w-full md:w-48 h-32 flex-shrink-0">
                        <img
                          src={room.photos[0]}
                          alt={room.type}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                    )}

                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium text-gray-800">
                            {room.type}
                          </h3>
                          <p className="text-gray-600 text-sm">
                            {room.description}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-amber-600">
                            Nu. {room.price}
                          </p>
                          <p className="text-sm text-gray-500">per night</p>
                        </div>
                      </div>

                      {room.amenities.length > 0 && (
                        <div className="mt-3">
                          <div className="flex flex-wrap gap-2">
                            {room.amenities
                              .slice(0, 5)
                              .map((amenity, index) => (
                                <div
                                  key={index}
                                  className="flex items-center text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                                >
                                  {amenity.icon !== "custom" ? (
                                    <span className="text-amber-500 mr-1">
                                      {getIconComponent(amenity.icon)}
                                    </span>
                                  ) : null}
                                  {amenity.name}
                                </div>
                              ))}
                            {room.amenities.length > 5 && (
                              <div className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                +{room.amenities.length - 5} more
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="mt-3 flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center text-gray-600">
                          {room.maxGuests}{" "}
                          {room.maxGuests > 1 ? "guests" : "guest"}
                        </div>
                        <div
                          className={`flex items-center ${
                            room.active ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {room.active ? (
                            <>
                              <Check className="mr-1" size={16} /> Active
                            </>
                          ) : (
                            <>
                              <X className="mr-1" size={16} /> Inactive
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 self-start md:self-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => startEditRoom(room)}
                        aria-label="Edit room"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteRoom(room.id)}
                        aria-label="Delete room"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <Footer />
    </div>
  );
};

export default RoomManagement;
