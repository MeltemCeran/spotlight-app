import { v } from "convex/values";
import { mutation } from "./_generated/server";

// Kullanıcının dosya yükleyebilmesi için bir URL oluşturur
export const generateUploadUrl = mutation(async (ctx) => {
  const identity = await ctx.auth.getUserIdentity(); // Kullanıcının kimliğini alır
  if (!identity) throw new Error("Unauthorized"); // Kullanıcı giriş yapmamışsa hata fırlatır
  return await ctx.storage.generateUploadUrl(); // Depolama için bir yükleme URL'si oluşturur ve döndürür
});

// Yeni bir post oluşturma işlemi
export const createPost = mutation({
  args: {
    caption: v.optional(v.string()), // Gönderi açıklaması (isteğe bağlı)
    storageId: v.id("_storage"), // Yüklenen görüntünün depolama kimliği
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity(); // Kullanıcının kimliğini alır
    if (!identity) throw new Error("Unauthorized"); // Kimlik yoksa hata fırlatır

    // Kullanıcının veritabanındaki kaydını bulur
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser) throw new Error("User not found"); // Kullanıcı yoksa hata döner

    // Kullanıcının yüklediği görselin URL'sini alır
    const imageUrl = await ctx.storage.getUrl(args.storageId);
    if (!imageUrl) throw new Error("Image not found"); // Görsel bulunamazsa hata döner

    /*
      Burada kafanı karıştıran nokta şu olabilir:
      - Kullanıcı bir dosya yüklediğinde, sistem bunu 'storageId' ile saklıyor.
      - Ancak bir post oluştururken, bu dosyanın gerçek URL'sini (imageUrl) almamız gerekiyor.
      - ctx.storage.getUrl(args.storageId) fonksiyonu, verilen 'storageId'ye karşılık gelen gerçek URL'yi getiriyor.
      - Eğer bu URL bulunamazsa, bu da bir hata oluşturuyor çünkü post'un bir görseli olmalı.
    */

    // Yeni bir gönderi oluşturur
    const postId = await ctx.db.insert("posts", {
      userId: currentUser._id, // Gönderiyi oluşturan kullanıcının kimliği
      imageUrl, // Görselin gerçek URL'si
      storageId: args.storageId, // Görselin depolama kimliği
      caption: args.caption, // Açıklama (varsa)
      likes: 0, // Beğeni sayısı başlangıçta 0
      comments: 0, // Yorum sayısı başlangıçta 0
    });

    // Kullanıcının toplam post sayısını 1 artırır
    await ctx.db.patch(currentUser._id, {
      posts: currentUser.posts + 1,
    });

    return postId; // Yeni oluşturulan post'un kimliğini döndürür
  },
});
