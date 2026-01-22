/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_mlx_setup.c                                     :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lraghave <lraghave@student.42singapore.sg> +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/11/25 20:40:02 by lraghave          #+#    #+#             */
/*   Updated: 2025/11/27 13:41:42 by lraghave         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */
#include "../header/so_long.h"

void	ft_load_images(t_mlx *mlx)
{
	int	w;
	int	h;

	w = 64;
	h = 64;
	mlx->player_image = mlx_xpm_file_to_image(mlx->mlx_ptr,
			"./img/p.xpm", &w, &h);
	mlx->collectible_image = mlx_xpm_file_to_image(mlx->mlx_ptr,
			"./img/c.xpm", &w, &h);
	mlx->exit_closed_image = mlx_xpm_file_to_image(mlx->mlx_ptr,
			"./img/ec.xpm", &w, &h);
	mlx->exit_open_image = mlx_xpm_file_to_image(mlx->mlx_ptr,
			"./img/eo.xpm", &w, &h);
	mlx->wall_image = mlx_xpm_file_to_image(mlx->mlx_ptr,
			"./img/w.xpm", &w, &h);
	mlx->floor_image = mlx_xpm_file_to_image(mlx->mlx_ptr,
			"./img/f.xpm", &w, &h);
	if (!mlx->player_image || !mlx->collectible_image
		|| !mlx->exit_closed_image || !mlx->exit_open_image
		|| !mlx->wall_image || !mlx->floor_image)
		ft_error("Failed to load images\n", mlx->game_map);
}

void	ft_draw_tile(t_mlx *mlx, char tile, int x, int y)
{
	if (tile == '1')
		mlx_put_image_to_window(mlx->mlx_ptr, mlx->mlx_window,
			mlx->wall_image, x, y);
	else if (tile == '0')
		mlx_put_image_to_window(mlx->mlx_ptr, mlx->mlx_window,
			mlx->floor_image, x, y);
	else if (tile == 'C')
		mlx_put_image_to_window(mlx->mlx_ptr, mlx->mlx_window,
			mlx->collectible_image, x, y);
	else if (tile == 'E')
		mlx_put_image_to_window(mlx->mlx_ptr, mlx->mlx_window,
			mlx->exit_closed_image, x, y);
	else if (tile == 'P')
		mlx_put_image_to_window(mlx->mlx_ptr, mlx->mlx_window,
			mlx->player_image, x, y);
}

void	ft_draw_map(t_mlx *mlx)
{
	int	row;
	int	col;

	row = 0;
	while (row < mlx->game_map->height)
	{
		col = 0;
		while (col < mlx->game_map->width)
		{
			ft_draw_tile(mlx, mlx->game_map->map[row][col],
				col * 64, row * 64);
			col++;
		}
		row++;
	}
}
