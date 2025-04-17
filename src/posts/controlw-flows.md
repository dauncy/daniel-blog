---
layout: layouts/blog-post.html
title: NextJS Code Design - Control Flows
date: 2025-04-15
tags: 
  - posts
excerpt: What are control flow components...? Why do I use them...? 
permalink: /nextjs-control-flow-components/
description: Explore NextJS control flow components & See my favorite implemtaion.
---

Control flow components in NextJS are specialized react components that allow us to conditionally render content based on certain conditions. Essentially control flows are a great way to abstract common functionality. 

---

## Just give me an example
```tsx
import { Suspense } from "react";

export default function Page() {
  return(
    <Suspense fallback={<div>loading...</div>}>
      <SomeAsyncComponent />
    </Suspense>
  )
}
```

React's Suspense compoent is a control flow component. The suspense component takes in two  separate nodes as props: `children` and `fallback`. While the promise node resolves, Suspense renders the fallback. Once the promise has been resolved, the component will render the value. Here's a pseudo-coe breakdown:

```tsx
export const Suspense = ({ 
  children, 
  fallback 
}: { 
  children: ReactNode;
  fallback?: ReactNode;
}) => {
  let resolvedChildren: ReactNode | undefined = undefined;

  Promise.resolve(children).then((node) => {
    resolvedChildren = node;
  });
  // once the promise is resolved, render the node
  if (resolvedChildren) {
    return(
      <>{resolvedChildren}</>
    )
  }

  // while the promise is resolving, render the fallback node
  if (fallback) {
    return(
      <>{fallback}</>
    )
  }
  return null;
}
```

In the actual react implementation, Suspense is not a regular component. It's a special component type handled directly by the React reconciler. The actual implementation of Suspense doesn't have a render method like regular components, rather react's reconciler handles Suspense boundaries specially when it encounters them. Nonetheless it's a solid example of control flow state management in components.

---

## No, a *real* example

I often use control flow components to abstract away commonly used business logic throughout my app. One great example of this is auth. 

Instead of doing something like this where we would manually check the user's session on each page and render content accordingly.

```tsx
import { getSession } from "@lib/auth";


export default async function Page() {
   const { userId } = await getSession();
   if (!userId) {
      return(
        <div>{"Please Log In"}</div>
      )
   }

   return(
     <div>
       <p>{`welcome user: ${userId}`}</p>
     </div>
   )
}
```

We could build a `VerifyAccess` control flow component:

```tsx
import { getSession } from "@lib/auth";

export async function VerifyAccess({ children, fallback }) {
  const { userId } = await getSession();

  if (!userId) {
    return(
      <>{fallback}</>
    )
  }

  return(
    <>{children}</>
  )
}
```

and then do something like this in our shared layout:

```tsx
// app/(dashboard)/layout.tsx
import { VerifyAccess } from "@components/control-flows";

export default function DashboardLayout({ children }) {
  return(
    <VerifyAccess
      fallback={<LoginModal dismissable={false} />}
    >
      {children}
    </VerifyAccess>
  )
}
```

Ok... that's a cute demonstration. But let's take this one step further. 

When we build *production-level* apps, how often is our verification ever that simple?

What happens when we add onboarding or subscriptions or some one off thing tied to the user we need to check against? 
Usually, we fix this by adding flags to the props. Something like `onboardingStep?: OnboardingStep` 
or `verifySubcription?: boolean` and so on...

Soon our nice abstraction becomes a tangled mess of optional flags and booleans.
At that point, we might as well just go back to our original *KISS* page-level implementation. At least our code would be more readable.

So, what can we do to keep our abstraction clean, but also extensible to future unforseen requirements?

React components are just functions. And like any javascript function, callbacks can be passed as arguments.

Let's see how our code looks when we pass a callback to the `VerifyAccess` component:

```tsx
import { getSession } from "@lib/auth";

export const VerifyAccess = async ({
  children,
  fallback,
}: {
  children: ({
    user
  }: {
    user: User;
  }) => ReactNode;
  fallback?: ReactNode;
}) => {
  const user = await getSession();

  if (!user) {
    return(
      <>{fallback}</>
    )
  }
  return children({ user })
};
```

Now we can have a little more control over our verification flow.
We need to check the user's onboarding state? No worries.

```tsx
// app/(dashboard)/onboarding-complete/page.tsx
import { OnboardingStep } from "@lib/types";

export default function Page() {
  return(
    <VerifyAcces>
      {({ user }) => {
        // user is typed!!
        const currentStep = user.onboardingStep;
        if (currentStep !== OnboardingStep.COMPLETED) {
          return(
            <div>
              {"Looks like you didn't finish onboarindg"}
              <Link href={'/onboarding'}>{"Finish"}</Link>
            </div>
          )
        }

        return(
          <Dashboard user={user}/>
        )
      }}
    </VerifyAcces>
  )
}
```

What if we need to check the user's subscription status? 

```tsx
// app/(dashboard)/members/add/page.tsx
import { OnboardingStep } from "@lib/types";

export default function AddMembersPage() {
  return(
    <VerifyAcces>
      {({ user }) => {
        if (!user.subscription || user.subscription.status !== 'active') {
          return (<NoSubscription />)
        }

        return(
          <InviteMembers subscription={subscription}/>
        )
      }}
    </VerifyAcces>
  )
}
```

This implementation is a flexible and type-safe abstraction that can evolve with our application's requirements and growing complexities.

---

## One last example

I'm gonna drop one of my go-to control flow components that I use in almost every project. Hopefully y'all will find it as useful as I do...

```tsx
//@components/control-flows/data-fetcher.tsx

interface DataFetcherProps<T> {
  fetcher: (...args: unknown[]) => Promise<T>;
  loading?: ReactNode;
  children: (data: T) => ReactNode;
}

export const DataFetcher = <T,>({ fetcher, loading, children }: DataFetcherProps<T>) => {
  return (
    <Suspense fallback={loading ?? <LoadingData />}>
      <AwaitedData fetcher={fetcher}>{children}</AwaitedData>
    </Suspense>
  );
};

const AwaitedData = async <T,>({ fetcher, children }: Pick<DataFetcherProps<T>, "fetcher" | "children">) => {
  try {
    const data = await fetcher();
    if (!data) {
      return <ErrorComp message="No data returned" />;
    }
    return children(data);
  } catch (error) {
    const message = getErrorMessage(error);
    return <ErrorComp message={message} />;
  }
};

const LoadingData = () => {
  return (
    <div>
      <Spinner className="animate-spin" />
    </div>
  );
};

export const ErrorComp = ({ message }: { message?: string }) => {
  return (
    <div>
     {message}
    </div>
  );
}
```

The usage of this abstraction is simple:

```tsx
// @app/(dashboard)/members/page.tsx

export default function MembersListPage() {
  return(
    <VerifyAcces>
      {(user) => 
        <DataFetcher 
          fetcher={() => getMembersList({ organizationId: user.organization_id })}
        >
          {(members) => 
            <div>
              {members.map((member) => 
                <MemberCard member={member} key={member.id}/>
              )}
            </div>
          }
        </DataFetcher>
      }
    </VerifyAcces>
  )
}
```

---

## Final Thoughts

The main takeaway - aside for my fondness towards render props - control flows are another useful tool to help us write maintainable code and flexible abstractions. 
