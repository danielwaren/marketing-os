import { useEffect, useState } from "react";

import { useWorkspace } from "@/features/workspace/hooks/useWorkspace";

import {
  getPosts,
  createPost,
  updatePost,
  deletePost,
} from "../services/post.service";

import type {
  CreatePostDto,
  Post,
  UpdatePostDto,
} from "../types/post";

export function usePosts() {
  const { workspace } = useWorkspace();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, [workspace]);

  async function load() {
    if (!workspace) {
      setLoading(false);
      return;
    }

    const { data } = await getPosts(workspace.id);

    if (data) {
      setPosts(data);
    }

    setLoading(false);
  }

  async function create(
    dto: CreatePostDto
  ) {
    if (!workspace) return;

    const result = await createPost(
      workspace.id,
      dto
    );

    if (result.data) {
      setPosts((old) => [
        result.data,
        ...old,
      ]);
    }

    return result;
  }

  async function update(
    id: string,
    dto: UpdatePostDto
  ) {
    const result = await updatePost(
      id,
      dto
    );

    if (result.data) {
      setPosts((old) =>
        old.map((post) =>
          post.id === id
            ? result.data
            : post
        )
      );
    }

    return result;
  }

  async function remove(id: string) {
    const result = await deletePost(id);

    if (!result.error) {
      setPosts((old) =>
        old.filter((p) => p.id !== id)
      );
    }

    return result;
  }

  return {
    workspace,
    posts,
    loading,
    create,
    update,
    remove,
    refresh: load,
  };
}
