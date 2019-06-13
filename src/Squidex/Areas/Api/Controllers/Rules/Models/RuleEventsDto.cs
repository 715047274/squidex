﻿// ==========================================================================
//  Squidex Headless CMS
// ==========================================================================
//  Copyright (c) Squidex UG (haftungsbeschränkt)
//  All rights reserved. Licensed under the MIT license.
// ==========================================================================

using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using Squidex.Domain.Apps.Entities.Rules;
using Squidex.Web;

namespace Squidex.Areas.Api.Controllers.Rules.Models
{
    public sealed class RuleEventsDto : Resource
    {
        /// <summary>
        /// The rule events.
        /// </summary>
        [Required]
        public RuleEventDto[] Items { get; set; }

        /// <summary>
        /// The total number of rule events.
        /// </summary>
        public long Total { get; set; }

        public static RuleEventsDto FromRuleEvents(IReadOnlyList<IRuleEventEntity> items, long total, ApiController controller, string app)
        {
            var result = new RuleEventsDto
            {
                Total = total,
                Items = items.Select(x => RuleEventDto.FromRuleEvent(x, controller, app)).ToArray()
            };

            return CreateLinks(result, controller, app);
        }

        private static RuleEventsDto CreateLinks(RuleEventsDto result, ApiController controller, string app)
        {
            result.AddSelfLink(controller.Url<RulesController>(x => nameof(x.GetEvents), new { app }));

            return result;
        }
    }
}
