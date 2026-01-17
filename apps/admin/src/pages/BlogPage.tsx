import { useState } from "react";
import { useBlogPosts, useDeleteBlogPost, useUpdateBlogPost } from "../hooks/useBlog";
import { BlogPost, BlogPostInput } from "../api/admin-blog";
import { Plus, Edit, Trash2, FileText, Eye, EyeOff, Search } from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "../components/ui/sheet";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Switch } from "../components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { LoadingButton } from "../components/ui/loading-button";

export default function BlogPage() {
  const { data: postsResponse, isLoading } = useBlogPosts();
  const deletePost = useDeleteBlogPost();
  const updatePost = useUpdateBlogPost();
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<BlogPostInput>>({
    title: "",
    description: "",
    slug: "",
    content: "",
    image: "",
    authors: [],
    categories: [],
    related: [],
    published: false,
  });

  const posts = postsResponse?.data || [];
  const filteredPosts =
    filter === "all"
      ? posts
      : filter === "published"
        ? posts.filter((p) => p.published)
        : posts.filter((p) => !p.published);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this blog post?")) {
      await deletePost.mutateAsync(id);
    }
  };

  const handleOpenDrawer = (post: BlogPost) => {
    setSelectedPost(post);
    setIsEditing(false);
    setEditForm({
      title: post.title,
      description: post.description || "",
      slug: post.slug,
      content: post.content,
      image: post.image,
      authors: post.authors || [],
      categories: post.categories || [],
      related: post.related || [],
      published: post.published,
    });
  };

  const handleSave = async () => {
    if (!selectedPost) return;

    await updatePost.mutateAsync({
      id: selectedPost.id,
      input: editForm,
    });

    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Blog Posts</h1>
          <p className="text-muted-foreground mt-2">Manage blog posts</p>
        </div>
        <div className="p-6 bg-card border border-border rounded-lg animate-pulse">
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Blog Posts</h1>
          <p className="text-muted-foreground mt-2">
            Manage blog posts ({filteredPosts.length} posts)
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Post
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select
          value={filter}
          onValueChange={(value) => setFilter(value as typeof filter)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter posts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Posts</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Posts List - Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredPosts.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-8 text-center text-muted-foreground">
            No blog posts found
          </div>
        ) : (
          filteredPosts.map((post) => (
            <div
              key={post.id}
              className="bg-card border border-border rounded-lg p-4 space-y-3 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenDrawer(post);
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold">{post.title}</h3>
                  </div>
                  {post.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {post.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Status</div>
                  {post.published ? (
                    <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                      <Eye className="h-3 w-3 mr-1" />
                      Published
                    </Badge>
                  ) : (
                    <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                      <EyeOff className="h-3 w-3 mr-1" />
                      Draft
                    </Badge>
                  )}
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Created</div>
                  <div className="text-sm">
                    {new Date(post.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-muted-foreground mb-1">Slug</div>
                  <div className="text-sm font-mono">{post.slug}</div>
                </div>
                {post.categories && post.categories.length > 0 && (
                  <div className="col-span-2">
                    <div className="text-xs text-muted-foreground mb-1">Categories</div>
                    <div className="flex flex-wrap gap-1">
                      {post.categories.map((cat) => (
                        <Badge key={cat} variant="outline" className="text-xs">
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Posts Table - Desktop View */}
      <div className="hidden md:block bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Slug
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Categories
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredPosts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                  No blog posts found
                </td>
              </tr>
            ) : (
              filteredPosts.map((post) => (
                <tr
                  key={post.id}
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={(e) => {
                    // Don't open drawer if clicking buttons
                    if ((e.target as HTMLElement).closest('button')) {
                      return;
                    }
                    handleOpenDrawer(post);
                  }}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{post.title}</div>
                        {post.description && (
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {post.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-mono">{post.slug}</div>
                  </td>
                  <td className="px-6 py-4">
                    {post.published ? (
                      <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                        <Eye className="h-3 w-3 mr-1" />
                        Published
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                        <EyeOff className="h-3 w-3 mr-1" />
                        Draft
                      </Badge>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {post.categories && post.categories.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {post.categories.slice(0, 2).map((cat) => (
                          <Badge key={cat} variant="outline" className="text-xs">
                            {cat}
                          </Badge>
                        ))}
                        {post.categories.length > 2 && (
                          <span className="text-xs text-muted-foreground">
                            +{post.categories.length - 2}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {new Date(post.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDrawer(post);
                          setIsEditing(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(post.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Blog Post Detail Drawer */}
      <Sheet
        open={!!selectedPost}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPost(null);
            setIsEditing(false);
          }
        }}
      >
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {isEditing ? "Edit Blog Post" : "Blog Post Details"}
            </SheetTitle>
            <SheetDescription>
              {selectedPost?.title
                ? isEditing
                  ? `Editing: ${selectedPost.title}`
                  : `Viewing: ${selectedPost.title}`
                : isEditing
                  ? "Update blog post information"
                  : "View blog post information"}
            </SheetDescription>
          </SheetHeader>
          {selectedPost && (
            <div className="space-y-6 py-6">
              {!isEditing ? (
                <>
                  {/* View Mode */}
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Title</div>
                      <div className="text-lg font-semibold">{selectedPost.title}</div>
                    </div>
                    {selectedPost.description && (
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Description</div>
                        <div className="text-sm">{selectedPost.description}</div>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Slug</div>
                        <div className="text-sm font-mono">{selectedPost.slug}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Status</div>
                        {selectedPost.published ? (
                          <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                            <Eye className="h-3 w-3 mr-1" />
                            Published
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                            <EyeOff className="h-3 w-3 mr-1" />
                            Draft
                          </Badge>
                        )}
                      </div>
                      {selectedPost.authors && selectedPost.authors.length > 0 && (
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Authors</div>
                          <div className="text-sm">{selectedPost.authors.join(", ")}</div>
                        </div>
                      )}
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Created</div>
                        <div className="text-sm">
                          {new Date(selectedPost.created_at).toLocaleString()}
                        </div>
                      </div>
                      {selectedPost.categories && selectedPost.categories.length > 0 && (
                        <div className="md:col-span-2">
                          <div className="text-sm text-muted-foreground mb-1">Categories</div>
                          <div className="flex flex-wrap gap-1">
                            {selectedPost.categories.map((cat) => (
                              <Badge key={cat} variant="outline">
                                {cat}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedPost.image && (
                        <div className="md:col-span-2">
                          <div className="text-sm text-muted-foreground mb-1">Image</div>
                          <img
                            src={selectedPost.image}
                            alt={selectedPost.title}
                            className="w-full h-48 object-cover rounded-lg"
                          />
                        </div>
                      )}
                    </div>
                    <div className="pt-4 border-t border-border">
                      <div className="text-sm text-muted-foreground mb-2">Content</div>
                      <div className="p-4 bg-muted rounded-lg text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
                        {selectedPost.content}
                      </div>
                    </div>
                  </div>

                  {/* Edit Button */}
                  <div className="pt-4 border-t border-border">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                      className="w-full"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Post
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {/* Edit Mode */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Edit Blog Post</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsEditing(false);
                          setEditForm({
                            title: selectedPost.title,
                            description: selectedPost.description || "",
                            slug: selectedPost.slug,
                            content: selectedPost.content,
                            image: selectedPost.image,
                            authors: selectedPost.authors || [],
                            categories: selectedPost.categories || [],
                            related: selectedPost.related || [],
                            published: selectedPost.published,
                          });
                        }}
                      >
                        Cancel
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Title *</Label>
                        <Input
                          id="title"
                          value={editForm.title || ""}
                          onChange={(e) =>
                            setEditForm({ ...editForm, title: e.target.value })
                          }
                          placeholder="Blog post title"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={editForm.description || ""}
                          onChange={(e) =>
                            setEditForm({ ...editForm, description: e.target.value })
                          }
                          placeholder="Short description"
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="slug">Slug *</Label>
                        <Input
                          id="slug"
                          value={editForm.slug || ""}
                          onChange={(e) =>
                            setEditForm({ ...editForm, slug: e.target.value })
                          }
                          placeholder="blog-post-slug"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="image">Image URL</Label>
                        <Input
                          id="image"
                          value={editForm.image || ""}
                          onChange={(e) =>
                            setEditForm({ ...editForm, image: e.target.value })
                          }
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="content">Content *</Label>
                        <Textarea
                          id="content"
                          value={editForm.content || ""}
                          onChange={(e) =>
                            setEditForm({ ...editForm, content: e.target.value })
                          }
                          placeholder="Blog post content"
                          rows={10}
                          className="font-mono text-sm"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch
                          id="published"
                          checked={editForm.published || false}
                          onCheckedChange={(checked) =>
                            setEditForm({ ...editForm, published: checked })
                          }
                        />
                        <Label htmlFor="published">Published</Label>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          <SheetFooter className="pt-4 border-t border-border">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setEditForm({
                      title: selectedPost?.title || "",
                      description: selectedPost?.description || "",
                      slug: selectedPost?.slug || "",
                      content: selectedPost?.content || "",
                      image: selectedPost?.image || "",
                      authors: selectedPost?.authors || [],
                      categories: selectedPost?.categories || [],
                      related: selectedPost?.related || [],
                      published: selectedPost?.published || false,
                    });
                  }}
                >
                  Cancel
                </Button>
                <LoadingButton
                  onClick={handleSave}
                  disabled={!editForm.title || !editForm.slug || !editForm.content || updatePost.isPending}
                  loading={updatePost.isPending}
                >
                  Save Changes
                </LoadingButton>
              </>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedPost(null);
                  setIsEditing(false);
                }}
              >
                Close
              </Button>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
