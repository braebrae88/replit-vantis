import { DELIVERABLE_TEMPLATES, type DeliverableTemplate } from "../server/deliverableTemplates";

function validateTemplates(): void {
  console.log("🔍 Validating deliverable templates...\n");

  let totalErrors = 0;
  let totalWarnings = 0;

  for (const template of DELIVERABLE_TEMPLATES) {
    console.log(`📦 Template: ${template.name} (${template.type})`);

    const errors: string[] = [];
    const warnings: string[] = [];

    if (!template.name || template.name.trim() === "") {
      errors.push("Template name is empty");
    }

    if (!template.description || template.description.trim() === "") {
      errors.push("Template description is empty");
    }

    if (!template.milestones || template.milestones.length === 0) {
      errors.push("Template has no milestones");
    } else {
      let milestoneIndex = 0;
      for (const milestone of template.milestones) {
        milestoneIndex++;
        const prefix = `Milestone ${milestoneIndex} (${milestone.name || "unnamed"})`;

        if (!milestone.name || milestone.name.trim() === "") {
          errors.push(`${prefix}: name is empty`);
        }

        if (!milestone.description || milestone.description.trim() === "") {
          warnings.push(`${prefix}: description is empty`);
        }

        if (!milestone.activities || milestone.activities.length === 0) {
          errors.push(`${prefix}: has no activities`);
        } else {
          let activityIndex = 0;
          for (const activity of milestone.activities) {
            activityIndex++;
            const actPrefix = `${prefix} > Activity ${activityIndex}`;

            if (!activity.name || activity.name.trim() === "") {
              errors.push(`${actPrefix}: name is empty`);
            }

            if (!activity.description || activity.description.trim() === "") {
              warnings.push(`${actPrefix}: description is empty`);
            }

            if (activity.requiresInput && (!activity.requiredInputs || activity.requiredInputs.length === 0)) {
              warnings.push(`${actPrefix}: marked as requiresInput but has no requiredInputs`);
            }
          }
        }

        if (milestone.suggestedWorkshopKey) {
          const workshopExists = template.workshopTemplates?.some(
            (w) => w.key === milestone.suggestedWorkshopKey
          );
          if (!workshopExists) {
            errors.push(`${prefix}: references workshop "${milestone.suggestedWorkshopKey}" but it doesn't exist`);
          }
        }
      }
    }

    if (template.workshopTemplates) {
      for (const workshop of template.workshopTemplates) {
        const wsPrefix = `Workshop "${workshop.key}"`;

        if (!workshop.title || workshop.title.trim() === "") {
          errors.push(`${wsPrefix}: title is empty`);
        }

        if (!workshop.agenda || workshop.agenda.length === 0) {
          warnings.push(`${wsPrefix}: has no agenda items`);
        }

        if (!workshop.recommendedAttendees || workshop.recommendedAttendees.length === 0) {
          warnings.push(`${wsPrefix}: has no recommended attendees`);
        }
      }
    }

    const milestoneCount = template.milestones?.length || 0;
    const activityCount = template.milestones?.reduce((sum, m) => sum + (m.activities?.length || 0), 0) || 0;
    const workshopCount = template.workshopTemplates?.length || 0;

    console.log(`   📊 ${milestoneCount} milestones, ${activityCount} activities, ${workshopCount} workshops`);

    if (errors.length > 0) {
      console.log(`   ❌ Errors:`);
      for (const error of errors) {
        console.log(`      - ${error}`);
      }
      totalErrors += errors.length;
    }

    if (warnings.length > 0) {
      console.log(`   ⚠️  Warnings:`);
      for (const warning of warnings) {
        console.log(`      - ${warning}`);
      }
      totalWarnings += warnings.length;
    }

    if (errors.length === 0 && warnings.length === 0) {
      console.log(`   ✅ Valid`);
    }

    console.log();
  }

  console.log("─".repeat(50));
  console.log(`\n📋 Summary: ${DELIVERABLE_TEMPLATES.length} templates validated`);
  console.log(`   ❌ ${totalErrors} errors`);
  console.log(`   ⚠️  ${totalWarnings} warnings`);

  if (totalErrors > 0) {
    console.log("\n🚨 Validation FAILED - fix errors before proceeding\n");
    process.exit(1);
  } else if (totalWarnings > 0) {
    console.log("\n✅ Validation PASSED with warnings\n");
  } else {
    console.log("\n✅ Validation PASSED - all templates are valid\n");
  }
}

validateTemplates();
