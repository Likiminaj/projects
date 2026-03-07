/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   so_long.c                                          :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lraghave <lraghave@student.42singapore.sg> +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/11/07 16:03:56 by lraghave          #+#    #+#             */
/*   Updated: 2025/11/27 18:04:20 by lraghave         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */
#include "../header/so_long.h"
#include <unistd.h>

// prototype(s)
static void	ft_init_data(t_mlx *mlx_utils, t_exit *exit_data,
				t_player *player_data, t_map_data *map_data);
static void	ft_parse_map(char *str, t_map_data *map_data);
static void	ft_start_game(t_mlx *mlx_utils, t_map_data *map_data);

int	main(int argc, char **argv)
{
	t_mlx		mlx_utils;
	t_exit		exit_data;
	t_player	player_data;
	t_map_data	map_data;

	if (argc != 2)
		ft_error("Invalid number of arguments\n", &map_data);
	else
	{
		ft_init_data(&mlx_utils, &exit_data, &player_data, &map_data);
		ft_parse_map(argv[1], &map_data);
		ft_validate_map(&map_data);
		ft_check_path(&map_data);
		ft_start_game(&mlx_utils, &map_data);
	}
}

static void	ft_init_data(t_mlx *mlx_utils, t_exit *exit_data,
			t_player *player_data, t_map_data *map_data)
{
	ft_memset(mlx_utils, 0, sizeof(*mlx_utils));
	ft_memset(exit_data, 0, sizeof(*exit_data));
	ft_memset(player_data, 0, sizeof(*player_data));
	ft_memset(map_data, 0, sizeof(*map_data));
	mlx_utils->game_map = map_data;
	map_data->exit = exit_data;
	map_data->player = player_data;
	map_data->map_fd = -1;
}

static void	ft_parse_map(char *str, t_map_data *map_data)
{
	int		len;
	int		bytes_read;
	char	buffer[1200];

	len = ft_strlen(str);
	if (len <= 4 || str[len - 5] == '/'
		|| ft_strncmp(&str[len -4], ".ber", 4) != 0)
		ft_error("Incorrect map file format\n", map_data);
	map_data->map_fd = open(str, O_RDONLY);
	if (map_data->map_fd == -1)
		ft_error("Map file could not be opened\n", map_data);
	bytes_read = read(map_data->map_fd, buffer, 1199);
	if (bytes_read == 0)
		ft_error("Empty map file\n", map_data);
	if (bytes_read == -1)
		ft_error("Could not read file\n", map_data);
	if (bytes_read > 1000)
		ft_error("File size is too big\n", map_data);
	buffer[bytes_read] = '\0';
	map_data->map = ft_split(buffer, '\n');
	map_data->map_flood = ft_split(buffer, '\n');
	if (!map_data->map || !map_data->map_flood)
		ft_error("Memory allocation failed\n", map_data);
}

static void	ft_start_game(t_mlx *mlx_utils, t_map_data *map_data)
{
	mlx_utils->mlx_ptr = mlx_init();
	if (!mlx_utils->mlx_ptr)
		ft_error("Failed to establish mlx connection\n", map_data);
	mlx_utils->mlx_window = mlx_new_window(mlx_utils->mlx_ptr,
			map_data->width * 64,
			map_data->height * 64,
			"so_long");
	if (!mlx_utils->mlx_window)
		ft_error("Failed window creations\n", map_data);
	ft_load_images(mlx_utils);
	ft_draw_map(mlx_utils);
	ft_setup_hooks(mlx_utils);
	mlx_loop(mlx_utils->mlx_ptr);
}
