import {
    BehaviorSubject,
    Subject,
    Observable,
    from,
    of,
    switchMap,
    tap,
    catchError,
    share,
    filter,
    map,
    startWith,
    distinctUntilChanged,
} from 'rxjs';

interface SuccessResource<T> extends Observable<T> {
    data: BehaviorSubject<T>;
    isLoading: Observable<false>;
    error: Observable<undefined>;
    refetch: () => void;
}
interface LoadingResource {
    data: BehaviorSubject<undefined>;
    isLoading: Observable<true>;
    error: Observable<undefined>;
    refetch: () => void;
}
interface ErrorResource {
    data: BehaviorSubject<undefined>;
    isLoading: Observable<false>;
    error: Observable<string>;
    refetch: () => void;
}

export type Resource<T> = SuccessResource<T> | LoadingResource | ErrorResource;

/**
 * Creates a reactive resource from an async function (e.g., a fetch request).
 * @param fetcher A function that returns a Promise of the data.
 * @param initialValue An optional initial value for the data BehaviorSubject.
 */
export function resource<T>(
    fetcher: () => Promise<T>,
    initialValue?: T
): Resource<T> {
    // --- Internal State Subjects ---
    const dataSubject = new BehaviorSubject<T | undefined>(initialValue);
    const loadingSubject = new BehaviorSubject<boolean>(false);
    const errorSubject = new BehaviorSubject<any | null>(null);
    const refetchSubject = new Subject<void>();

    // The main stream that handles fetching logic.
    const fetchStream$ = refetchSubject.pipe(
        // Start the stream immediately on creation.
        startWith(null),
        // For each trigger, set loading state to true.
        tap(() => loadingSubject.next(true)),
        // switchMap cancels previous pending fetches and switches to the new one.
        switchMap(() =>
            from(fetcher()).pipe(
                // If the fetch succeeds...
                tap(data => {
                    dataSubject.next(data);
                    errorSubject.next(null); // Clear previous errors
                }),
                // If the fetch fails...
                catchError(err => {
                    errorSubject.next(err);
                    return of(undefined); // Prevent the main stream from dying
                })
            )
        ),
        // After every attempt (success or failure), set loading to false.
        tap(() => loadingSubject.next(false)),
        share() // Share this stream across all parts of the resource
    );

    // The resource object itself is an observable of the successful data.
    const resourceObservable$ = fetchStream$.pipe(
        filter((data): data is T => data !== undefined)
    );

    // We subscribe to the fetch stream here to kick everything off.
    // This subscription lasts for the lifetime of the resource.
    resourceObservable$.subscribe();

    // --- The Public API Object ---
    // We cast the main observable to `any` to attach our properties to it.
    const resource: any = resourceObservable$;

    resource.data = dataSubject;
    resource.isLoading = loadingSubject.asObservable().pipe(distinctUntilChanged());
    resource.error = errorSubject.asObservable().pipe(distinctUntilChanged());
    resource.refetch = () => refetchSubject.next();

    return resource as Resource<T>;
}