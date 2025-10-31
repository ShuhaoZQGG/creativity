'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Sparkles,
  LayoutDashboard,
  Wand2,
  TestTube,
  BarChart3,
  Settings,
  LogOut,
  Loader2,
  Image as ImageIcon,
  Upload,
  X
} from 'lucide-react';

interface Creative {
  id: string;
  headline: string;
  body: string;
  cta: string;
  image_url: string;
  score: {
    overall: number;
    clarity: number;
    engagement: number;
    cta: number;
  };
}

export default function GeneratePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [creatives, setCreatives] = useState<Creative[]>([]);

  const [brandName, setBrandName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [tone, setTone] = useState('friendly');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [numVariants, setNumVariants] = useState(3);

  // Base image upload states
  const [useBaseImage, setUseBaseImage] = useState(false);
  const [baseImageFile, setBaseImageFile] = useState<File | null>(null);
  const [baseImagePreview, setBaseImagePreview] = useState<string | null>(null);
  const [baseImageS3Key, setBaseImageS3Key] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBaseImageFile(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setBaseImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async () => {
    if (!baseImageFile) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', baseImageFile);

      const response = await api.post('/api/upload-base-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setBaseImageS3Key(response.data.s3Key);
      alert('Image uploaded successfully!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setBaseImageFile(null);
    setBaseImagePreview(null);
    setBaseImageS3Key(null);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setCreatives([]);

    try {
      // If using base image, upload first if not already uploaded
      let s3Key = baseImageS3Key;
      if (useBaseImage && baseImageFile && !baseImageS3Key) {
        setUploadingImage(true);
        const formData = new FormData();
        formData.append('image', baseImageFile);

        const uploadResponse = await api.post('/api/upload-base-image', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        s3Key = uploadResponse.data.s3Key;
        setBaseImageS3Key(s3Key);
        setUploadingImage(false);
      }

      const response = await api.post('/api/generate', {
        brand_name: brandName,
        product_description: productDescription,
        target_audience: targetAudience,
        tone,
        website_url: websiteUrl,
        num_variants: numVariants,
        base_image_s3_key: useBaseImage ? s3Key : null,
      });

      setCreatives(response.data.creatives);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to generate creatives');
    } finally {
      setLoading(false);
      setUploadingImage(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 border-r bg-card flex-col">
        <div className="p-6 border-b">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Creativity
            </span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Link href="/dashboard">
            <Button variant="ghost" className="w-full justify-start gap-3" size="lg">
              <LayoutDashboard className="h-5 w-5" />
              Dashboard
            </Button>
          </Link>
          <Link href="/generate">
            <Button variant="secondary" className="w-full justify-start gap-3" size="lg">
              <Wand2 className="h-5 w-5" />
              Generate
            </Button>
          </Link>
          <Link href="/creatives">
            <Button variant="ghost" className="w-full justify-start gap-3" size="lg">
              <ImageIcon className="h-5 w-5" />
              Creatives
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="ghost" className="w-full justify-start gap-3" size="lg">
              <TestTube className="h-5 w-5" />
              A/B Tests
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="ghost" className="w-full justify-start gap-3" size="lg">
              <BarChart3 className="h-5 w-5" />
              Analytics
            </Button>
          </Link>
        </nav>

        <div className="p-4 border-t space-y-2">
          <Button variant="ghost" className="w-full justify-start gap-3" size="lg">
            <Settings className="h-5 w-5" />
            Settings
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3 text-destructive hover:text-destructive" size="lg" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b bg-card">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold">Generate Creatives</h1>
            <p className="text-sm text-muted-foreground">
              Use AI to create high-performing ad creatives in seconds
            </p>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="grid gap-6 lg:grid-cols-2 max-w-7xl mx-auto">
            {/* Input Form */}
            <Card className="border-2 h-fit sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="h-5 w-5 text-primary" />
                  Brand Information
                </CardTitle>
                <CardDescription>
                  Tell us about your product to generate tailored ad creatives
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleGenerate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="brandName">Brand Name</Label>
                    <Input
                      id="brandName"
                      placeholder="EcoBrew Coffee"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      required
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="productDescription">Product Description</Label>
                    <Textarea
                      id="productDescription"
                      placeholder="Organic coffee pods compatible with Nespresso machines. Made from 100% compostable materials..."
                      value={productDescription}
                      onChange={(e) => setProductDescription(e.target.value)}
                      required
                      className="min-h-[100px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="targetAudience">Target Audience</Label>
                    <Input
                      id="targetAudience"
                      placeholder="Environment-conscious coffee lovers, ages 25-45"
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      required
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tone">Brand Tone</Label>
                    <select
                      id="tone"
                      className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                    >
                      <option value="friendly">Friendly & Approachable</option>
                      <option value="professional">Professional & Corporate</option>
                      <option value="playful">Playful & Fun</option>
                      <option value="urgent">Urgent & Action-Driven</option>
                      <option value="luxurious">Luxurious & Premium</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="websiteUrl">Website URL (optional)</Label>
                    <Input
                      id="websiteUrl"
                      type="url"
                      placeholder="https://ecobrew.com"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="numVariants">Number of Variants</Label>
                    <Input
                      id="numVariants"
                      type="number"
                      min="1"
                      max="5"
                      value={numVariants}
                      onChange={(e) => setNumVariants(parseInt(e.target.value))}
                      className="h-11"
                    />
                    <p className="text-xs text-muted-foreground">Generate 1-5 creative variants</p>
                  </div>

                  {/* Base Image Upload Section */}
                  <div className="border-t pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base">Base Image (optional)</Label>
                      <Button
                        type="button"
                        variant={useBaseImage ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => {
                          setUseBaseImage(!useBaseImage);
                          if (useBaseImage) {
                            handleRemoveImage();
                          }
                        }}
                      >
                        {useBaseImage ? "Using Base Image" : "Upload Base Image"}
                      </Button>
                    </div>

                    {useBaseImage && (
                      <div className="space-y-3">
                        <p className="text-xs text-muted-foreground">
                          Upload an image to generate variations based on your style. The AI will create variants while maintaining brand consistency.
                        </p>

                        {!baseImagePreview ? (
                          <div className="border-2 border-dashed rounded-lg p-8 text-center">
                            <input
                              type="file"
                              id="base-image-input"
                              className="hidden"
                              accept="image/*"
                              onChange={handleImageSelect}
                            />
                            <label
                              htmlFor="base-image-input"
                              className="cursor-pointer flex flex-col items-center gap-2"
                            >
                              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <Upload className="h-6 w-6 text-primary" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">Click to upload image</p>
                                <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
                              </div>
                            </label>
                          </div>
                        ) : (
                          <div className="relative">
                            <img
                              src={baseImagePreview}
                              alt="Base image preview"
                              className="w-full h-48 object-cover rounded-lg"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2"
                              onClick={handleRemoveImage}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            {baseImageS3Key && (
                              <div className="absolute bottom-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                                Uploaded
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <Button type="submit" className="w-full h-11" disabled={loading || uploadingImage} size="lg">
                    {uploadingImage ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Uploading Image...
                      </span>
                    ) : loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Generating Creatives...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Wand2 className="h-5 w-5" />
                        Generate Creatives
                      </span>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Results */}
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold mb-2">Generated Creatives</h2>
                <p className="text-muted-foreground">
                  {loading ? 'AI is creating your ad variants...' :
                   creatives.length > 0 ? `${creatives.length} creative${creatives.length > 1 ? 's' : ''} generated` :
                   'Fill in the form to generate your first creative'}
                </p>
              </div>

              {loading && (
                <Card className="border-2">
                  <CardContent className="pt-12 pb-12 text-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                    <div>
                      <p className="font-semibold mb-1">Creating your ad creatives</p>
                      <p className="text-sm text-muted-foreground">
                        This may take 30-60 seconds. AI is generating images and copy...
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {creatives.length > 0 && (
                <div className="space-y-4">
                  {creatives.map((creative, index) => (
                    <Card key={creative.id} className="border-2 hover:border-primary/50 transition-colors">
                      <CardContent className="pt-6 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-muted-foreground">
                            Variant {index + 1}
                          </span>
                          <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">
                            Score: {(creative.score.overall * 100).toFixed(0)}
                          </div>
                        </div>

                        <div className="relative overflow-hidden rounded-lg">
                          <img
                            src={creative.image_url}
                            alt={creative.headline}
                            className="w-full h-64 object-cover"
                          />
                        </div>

                        <div className="space-y-3">
                          <div>
                            <h3 className="font-bold text-xl mb-2">{creative.headline}</h3>
                            <p className="text-muted-foreground">{creative.body}</p>
                          </div>

                          <div className="bg-muted/50 p-4 rounded-lg">
                            <h4 className="font-semibold mb-3 text-sm">AI Performance Scores</h4>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">Overall</span>
                                  <span className="font-bold">{(creative.score.overall * 100).toFixed(0)}</span>
                                </div>
                                <div className="h-2 bg-background rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary transition-all"
                                    style={{width: `${creative.score.overall * 100}%`}}
                                  />
                                </div>
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">Clarity</span>
                                  <span className="font-bold">{(creative.score.clarity * 100).toFixed(0)}</span>
                                </div>
                                <div className="h-2 bg-background rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-blue-500 transition-all"
                                    style={{width: `${creative.score.clarity * 100}%`}}
                                  />
                                </div>
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">Engagement</span>
                                  <span className="font-bold">{(creative.score.engagement * 100).toFixed(0)}</span>
                                </div>
                                <div className="h-2 bg-background rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-green-500 transition-all"
                                    style={{width: `${creative.score.engagement * 100}%`}}
                                  />
                                </div>
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">CTA</span>
                                  <span className="font-bold">{(creative.score.cta * 100).toFixed(0)}</span>
                                </div>
                                <div className="h-2 bg-background rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-purple-500 transition-all"
                                    style={{width: `${creative.score.cta * 100}%`}}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          <Button className="w-full" size="lg">{creative.cta}</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  <Button
                    variant="outline"
                    className="w-full"
                    size="lg"
                    onClick={() => router.push('/dashboard')}
                  >
                    View All Creatives in Dashboard
                  </Button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
