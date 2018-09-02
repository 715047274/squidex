﻿// ==========================================================================
//  Squidex Headless CMS
// ==========================================================================
//  Copyright (c) Squidex UG (haftungsbeschraenkt)
//  All rights reserved. Licensed under the MIT license.
// ==========================================================================

using System.ComponentModel.DataAnnotations;
using Squidex.Domain.Apps.Core.HandleRules;
using Squidex.Domain.Apps.Core.Rules;

namespace Squidex.Extensions.Actions.Algolia
{
    [RuleActionHandler(typeof(AlgoliaActionHandler))]
    [RuleAction(Link = "https://www.algolia.com/",
        Display = "Populate Algolia index",
        Description = "Populate and synchronize indices in Algolia for full text search.")]
    public sealed class AlgoliaAction : RuleAction
    {
        [Required]
        [Display(Name = "Application Id", Description = "The application ID.")]
        public string AppId { get; set; }

        [Required]
        [Display(Name = "Api Key", Description = "The API key to grant access to Squidex.")]
        public string ApiKey { get; set; }

        [Required]
        [Display(Name = "Index Name", Description = "THe name of the index.")]
        public string IndexName { get; set; }
    }
}