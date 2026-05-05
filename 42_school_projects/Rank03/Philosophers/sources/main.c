#include "philo.h"

int	main(int argc, char **argv)
{
	t_table	table;

	if (argc != 5 && argc != 6)
	{
		printf("Error\nUsage: ./philo number_of_philosophers ");
		printf("time_to_die time_to_eat time_to_sleep [must_eat]\n");
		return (1);
	}
	if (!parse_args(argc, argv, &table))
		return (printf("Error\nInvalid arguments\n"), 1);
	if (!init_table(&table))
		return (printf("Error\nInit failed\n"), 1);
	if (!start_simulation(&table))
	{
		cleanup(&table);
		return (printf("Error\nThread creation failed\n"), 1);
	}
	cleanup(&table);
	return (0);
}
