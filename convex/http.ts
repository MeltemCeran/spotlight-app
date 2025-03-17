import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { Webhook } from "svix";
import { api } from "./_generated/api";

const http = httpRouter();

// Webhook eventinin Clerk'ten geliyor olmasına dikkat edicez
// Eğer öyleyse "user.created" eventini dinleyeceğiz
// Daha sonra kullanıcıyı veritabanına kaydedeceğiz

http.route({
  path: "/clerk-webhook", // Webhook endpointi belirleniyor
  method: "POST", // HTTP POST methodunu kullanıyor
  handler: httpAction(async (ctx, request) => {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error("Missing CLERK_WEBHOOK_SECRET environment variable"); // Eğer çevre değişkeni tanımlı değilse hata döndür
    }

    // Webhook doğrulaması için gerekli olan header bilgileri alınıyor
    const svix_id = request.headers.get("svix-id");
    const svix_signature = request.headers.get("svix-signature");
    const svix_timestamp = request.headers.get("svix-timestamp");

    if (!svix_id || !svix_signature || !svix_timestamp) {
      return new Response("Error occured -- no svix headers", { status: 400 }); // Gerekli header'lar eksikse hata döndür
    }

    const payload = await request.json(); // JSON formatındaki veriyi alıyoruz
    const body = JSON.stringify(payload);

    const wh = new Webhook(webhookSecret);
    let evt: any;

    // Webhook doğrulaması yapılıyor
    try {
      evt = wh.verify(body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }) as any;
    } catch (err) {
      console.error("Error verifying webhook:", err);
      return new Response("Error occured", { status: 400 }); // Doğrulama başarısız olursa hata döndür
    }

    const eventType = evt.type; // Webhook event türünü alıyoruz

    if (eventType === "user.created") {
      // Kullanıcı oluşturma eventini dinliyoruz
      const { id, email_addresses, first_name, last_name, image_url } =
        evt.data;

      const email = email_addresses?.[0]?.email_address; // 📌 İlk email adresini alıyoruz
      const name = `${first_name || ""} ${last_name || ""}`.trim(); // 📌 İsmi birleştirip boşlukları temizliyoruz

      if (!email) {
        console.log("Error: Email is undefined");
        return new Response("Email is required", { status: 400 }); // 📌 Email bilgisi olmadan kullanıcı kaydedilemez
      }

      try {
        await ctx.runMutation(api.users.createUser, {
          email: email,
          fullname: name,
          image: image_url,
          clerkId: id,
          username: email.split("@")[0], // 📌 Kullanıcı adını email'in @ öncesinden oluşturuyoruz
        });
      } catch (error) {
        console.log("Error creating user:", error);
        return new Response("Error creating user", { status: 500 }); // 📌 Kullanıcı oluşturma başarısız olursa hata döndür
      }
    }

    return new Response("Webhook processed successfully", { status: 200 }); // Başarılı işlem sonrası yanıt döndür
  }),
});

export default http;
