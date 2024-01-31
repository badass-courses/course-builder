"use client";

import * as React from "react";
import { api } from "@/trpc/react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Form,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Textarea,
} from "@coursebuilder/ui";

const EditTutorialFormSchema = z.object({
  title: z.string().min(2).max(90),
  description: z.string().optional(),
  lessons: z.array(
    z.object({
      _id: z.string(),
      title: z.string().min(2).max(90),
    }),
  ),
});

export function EditTutorialForm({
  moduleSlug,
  initialTutorialData,
}: {
  moduleSlug: string;
  initialTutorialData: {
    title: string;
    description: string;
    lessons: { _id: string; title: string }[];
  };
}) {
  const form = useForm<z.infer<typeof EditTutorialFormSchema>>({
    resolver: zodResolver(EditTutorialFormSchema),
    defaultValues: initialTutorialData,
  });

  const { isSubmitting, isDirty, isValid } = form.formState;

  const { data: tutorial, status: tutorialStatus } =
    api.module.getTutorial.useQuery({
      slug: moduleSlug,
    });

  const { fields, replace, move } = useFieldArray({
    control: form.control,
    name: "lessons",
  });

  const handleMove = (from: number, to: number) => {
    move(from, to);
  };

  const { mutate: updateTutorial } = api.module.updateTutorial.useMutation();

  const onSubmit = async (values: z.infer<typeof EditTutorialFormSchema>) => {
    if (!tutorial) return;
    updateTutorial({
      tutorialId: tutorial?._id,
      updateData: values,
    });
  };

  return tutorialStatus === "success" ? (
    <div className="flex">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {fields.map((field, index) => (
            <FormItem key={field.id}>
              <Input
                type="hidden"
                {...form.register(`lessons.${index}.title`)}
              />
            </FormItem>
          ))}
          <div>Edit Tutorial Form</div>
          <FormField
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-lg font-bold">Title</FormLabel>
                <FormDescription className="mt-2 text-sm">
                  A title should summarize the tip and explain what it is about
                  clearly.
                </FormDescription>
                <Input {...field} />
                <FormMessage />
              </FormItem>
            )}
            name="title"
          />
          <FormField
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-lg font-bold">Description</FormLabel>
                <Textarea {...field} />
                <FormMessage />
              </FormItem>
            )}
            name="description"
          />

          <Button type="submit" disabled={!isDirty && !isValid}>
            {isSubmitting ? "Saving" : "Save Tutorial"}
          </Button>
        </form>
      </Form>
    </div>
  ) : null;
}
