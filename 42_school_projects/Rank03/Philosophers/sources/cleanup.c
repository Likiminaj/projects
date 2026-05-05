#include "philo.h"

void	cleanup(t_table *table)
{
	int	i;

	i = 0;
	while (i < table->count)
	{
		pthread_mutex_destroy(&table->forks[i]);
		i++;
	}
	pthread_mutex_destroy(&table->print_lock);
	pthread_mutex_destroy(&table->state_lock);
	free(table->forks);
	free(table->philos);
}
