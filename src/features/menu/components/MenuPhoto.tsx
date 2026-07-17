import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

interface Props {
  filePath: string;
}

export function MenuPhoto({ filePath }: Props) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    async function load() {
      const { data } = await supabase.storage
        .from("media")
        .createSignedUrl(filePath, 3600);

      if (data?.signedUrl) {
        setUrl(data.signedUrl);
      }
    }

    load();
  }, [filePath]);

  if (!url) {
    return null;
  }

  return (
    <img
      src={url}
      alt="Menú del día"
      className="mt-4 h-64 w-full rounded-xl object-cover"
    />
  );
}