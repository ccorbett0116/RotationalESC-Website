from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date, timedelta
from analytics.services import AnalyticsService
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Update analytics summaries and product popularity statistics'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=1,
            help='Number of days to process (default: 1)'
        )
        parser.add_argument(
            '--date',
            type=str,
            help='Specific date to process (YYYY-MM-DD format)'
        )
        parser.add_argument(
            '--update-products',
            action='store_true',
            help='Update product popularity statistics'
        )
        parser.add_argument(
            '--generate-summaries',
            action='store_true',
            help='Generate daily summaries'
        )

    def handle(self, *args, **options):
        start_time = timezone.now()
        
        if not options['update_products'] and not options['generate_summaries']:
            # If no specific action specified, do both
            options['update_products'] = True
            options['generate_summaries'] = True
        
        self.stdout.write(
            self.style.SUCCESS('Starting analytics update process...')
        )

        # Update product popularity if requested
        if options['update_products']:
            self.stdout.write('Updating product popularity statistics...')
            try:
                updated_count = AnalyticsService.update_all_product_popularity()
                self.stdout.write(
                    self.style.SUCCESS(f'Updated popularity stats for {updated_count} products')
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'Error updating product popularity: {e}')
                )
                logger.error(f'Error updating product popularity: {e}')

        # Generate summaries if requested
        if options['generate_summaries']:
            self.stdout.write('Generating daily summaries...')
            try:
                if options['date']:
                    # Process specific date
                    target_date = date.fromisoformat(options['date'])
                    summary = AnalyticsService.generate_daily_summary(target_date)
                    if summary:
                        self.stdout.write(
                            self.style.SUCCESS(f'Generated summary for {target_date}')
                        )
                    else:
                        self.stdout.write(
                            self.style.ERROR(f'Failed to generate summary for {target_date}')
                        )
                else:
                    # Process multiple days
                    days_to_process = options['days']
                    today = timezone.now().date()
                    
                    for i in range(days_to_process):
                        target_date = today - timedelta(days=i+1)  # Start from yesterday
                        
                        self.stdout.write(f'Processing {target_date}...')
                        summary = AnalyticsService.generate_daily_summary(target_date)
                        
                        if summary:
                            self.stdout.write(
                                self.style.SUCCESS(f'✓ Generated summary for {target_date}')
                            )
                        else:
                            self.stdout.write(
                                self.style.ERROR(f'✗ Failed to generate summary for {target_date}')
                            )
                            
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'Error generating summaries: {e}')
                )
                logger.error(f'Error generating summaries: {e}')

        # Show completion time
        duration = timezone.now() - start_time
        self.stdout.write(
            self.style.SUCCESS(
                f'\nAnalytics update completed in {duration.total_seconds():.2f} seconds'
            )
        )