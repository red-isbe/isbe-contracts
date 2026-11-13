/* -----------------------------------------------------------------------------------
Copyright (c) 2025 Comunidad de Madrid & Alastria
Licensed under the Apache License, Version 2.0 (the "License");
You may not use this file except in compliance with the License.
You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
----------------------------------------------------------------------------------- */
import { DEFAULT_FACETS } from './deployAllFacets'

/**
 * Raised when the `--facets` argument of a deployment task is not a valid
 * selection. The task must stop before deploying or sending anything.
 */
export class FacetSelectionError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'FacetSelectionError'
    }
}

/**
 * Validates the `--facets` argument of the diamond deployment tasks.
 *
 * - `undefined` means "no selection": the caller uses every ISBE facet.
 * - Anything else must be a non-empty JSON array of known facet names without
 *   duplicates. An empty list, an unknown name or a repeated name is an error,
 *   never a warning: silently dropping names is what once turned a selection
 *   into an empty list and left the governance diamond without facets.
 *
 * @param facets Raw value of the `--facets` task argument
 * @param knownFacets Facet names accepted by the task (default: all ISBE facets)
 * @returns The validated facet names, or `undefined` when no selection was given
 * @throws FacetSelectionError when the selection is not valid
 */
export function resolveFacetSelection(
    facets: unknown,
    knownFacets: readonly string[] = DEFAULT_FACETS
): string[] | undefined {
    // Only an omitted argument means "no selection". `--facets null` is an error,
    // not a silent full replacement.
    if (facets === undefined) {
        return undefined
    }

    if (!Array.isArray(facets)) {
        throw new FacetSelectionError(
            `--facets must be a JSON array of facet names, got: ${JSON.stringify(facets)}`
        )
    }

    if (facets.length === 0) {
        throw new FacetSelectionError(
            '--facets is an empty list. Nothing will be deployed or changed. ' +
                'Omit --facets to work with every ISBE facet.'
        )
    }

    const notStrings = facets.filter((facet) => typeof facet !== 'string')
    if (notStrings.length > 0) {
        throw new FacetSelectionError(
            `--facets must only contain facet names, got: ${JSON.stringify(notStrings)}`
        )
    }

    const names = facets as string[]
    const known = new Set(knownFacets)
    const unknown = names.filter((name) => !known.has(name))
    if (unknown.length > 0) {
        throw new FacetSelectionError(
            `Unknown facet(s) in --facets: ${unknown.join(', ')}. ` +
                'Nothing will be deployed or changed.\n' +
                `   Known facets: ${knownFacets.join(', ')}`
        )
    }

    const duplicated = names.filter(
        (name, index) => names.indexOf(name) !== index
    )
    if (duplicated.length > 0) {
        throw new FacetSelectionError(
            `Duplicated facet(s) in --facets: ${[...new Set(duplicated)].join(', ')}`
        )
    }

    return names
}
