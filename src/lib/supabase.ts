import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);


export async function uploadFile(file: File) {
  return new Promise(async (resolve, reject) => {
    const filePath = `audio/${file.name}`;

    const { data, error } = await supabase.storage.from("meetings").upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type,
    });

    if (error) {
      reject(error);
      return;
    }

    const { data: publicUrlData } = supabase.storage.from("meetings").getPublicUrl(filePath);
    resolve(publicUrlData.publicUrl as string);
  });
}

